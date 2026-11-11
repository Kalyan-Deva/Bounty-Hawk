import logging
import os
import psutil
import re
import signal
import subprocess
import sys
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

TOOLKIT_DIR = Path(__file__).resolve().parent

DOMAIN_PATTERN = re.compile(
    r"^(?=.{1,253}$)"
    r"(?:"
    r"[a-zA-Z0-9]"
    r"(?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?"
    r"\."
    r")+"
    r"[a-zA-Z]{2,63}$"
)


def validate_domain(value):
    if not isinstance(value, str):
        raise ValueError("Domain must be a string")

    domain = value.strip().lower()

    if not DOMAIN_PATTERN.fullmatch(domain):
        raise ValueError("Invalid domain format")

    return domain

app = Flask(__name__)
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# Browser origins allowed to call the toolkit. The Vite client proxies its
# requests, and they arrive with one of these.
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get(
    "BH_ALLOWED_ORIGINS",
    "http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:4173,http://localhost:4173",
).split(",") if o.strip()]
CORS(app, origins=ALLOWED_ORIGINS)

@app.before_request
def block_cross_site_requests():
    # Any other web page you visit could otherwise start or stop scans here.
    # Requests without an Origin header (the Express API, curl) are allowed.
    origin = request.headers.get("Origin")
    if origin and origin not in ALLOWED_ORIGINS:
        return jsonify({"error": f"Origin {origin} is not allowed"}), 403

class Scan:
    def __init__(self):
        self.scan_running = False
        self.scan_step = 0
        self.scan_complete = 0
        self.scan_step_name = "N/a"
        self.scan_target = "N/a"
        self.core_module = "N/a"

scan_obj = Scan()

def start_scan(fire_starter, fire_cloud, fire_scanner, domain_count, core_module):
    global scan_obj
    scan_obj.scan_running = True
    scan_obj.scan_step = 1
    counter = 0
    if fire_starter:
        counter += 14
    if fire_cloud:
        counter += 8
    if fire_scanner:
        counter += 12
    scan_obj.scan_complete = counter * domain_count
    scan_obj.core_module = core_module
    scan_obj.scan_step_name = "Starting..."
    scan_obj.scan_target = "Sorting..."

def stop_scan():
    global scan_obj
    scan_obj.scan_running = False
    scan_obj.scan_step = 0
    scan_obj.scan_complete = 0
    scan_obj.scan_step_name = "Not Running"
    scan_obj.core_module = "N/a"
    scan_obj.scan_target = "N/a"

def cancel_subprocesses():
    current_pid = os.getpid()
    all_processes = psutil.process_iter(attrs=['pid', 'ppid', 'cmdline'])
    for process in all_processes:
        pid = process.info['pid']
        ppid = process.info['ppid']
        cmdline = process.info['cmdline']
        if ppid == current_pid and pid != current_pid:
            print(f"Terminating subprocess {pid}: {' '.join(cmdline)}")
            try:
                os.kill(pid, signal.SIGTERM)
            except ProcessLookupError:
                print(f"Process {pid} not found.")

@app.route('/terminate-subprocesses', methods=['GET'])
def terminate_subprocesses():
    try:
        cancel_subprocesses()
        return jsonify({'message': 'Subprocesses terminated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"message":"pong!"})

@app.route('/status', methods=['GET'])
def status():
    global scan_obj
    if scan_obj.scan_running:
        return jsonify({
            "scan_running":True,
            "scan_step":scan_obj.scan_step,
            "scan_complete":scan_obj.scan_complete,
            "scan_step_name":scan_obj.scan_step_name,
            "scan_target":scan_obj.scan_target,
            "core_module":scan_obj.core_module
            })
    else:
        return jsonify({
            "scan_running":False,
            "scan_step":scan_obj.scan_step,
            "scan_complete":scan_obj.scan_complete,
            "scan_step_name":scan_obj.scan_step_name,
            "scan_target":scan_obj.scan_target
            })
    
@app.route('/update-scan', methods=['POST'])
def update_scan():
    global scan_obj
    if scan_obj.scan_running:
        data = request.get_json()
        scan_obj.scan_step += 1
        scan_obj.scan_step_name = data['stepName']
        scan_obj.scan_target = data['target_domain']
        return jsonify({
                "scan_running":scan_obj.scan_running,
                "scan_step":scan_obj.scan_step,
                "scan_step_name":scan_obj.scan_step_name,
                "target_domain":scan_obj.scan_target
                })
    else:
        return jsonify({"message": "ERROR: Scan Not Currently Running..."})

@app.route("/wildfire", methods=["POST"])
def wildfire():
    global scan_obj

    if scan_obj.scan_running:
        return jsonify({
            "message": "ERROR: Scan Running..."
        }), 409

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Request body must contain valid JSON"
        }), 400

    fire_starter = data.get("fireStarter", False)
    fire_cloud = data.get("fireCloud", False)
    fire_scanner = data.get("fireScanner", False)
    scan_single_domain = data.get("scanSingleDomain", False)
    domain_count = data.get("domainCount", 1)

    # Require actual Boolean values.
    boolean_values = [
        fire_starter,
        fire_cloud,
        fire_scanner,
        scan_single_domain,
    ]

    if not all(isinstance(value, bool) for value in boolean_values):
        return jsonify({
            "error": "Scan options must be Boolean values"
        }), 400

    try:
        domain_count = int(domain_count)

        if domain_count < 1:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({
            "error": "domainCount must be a positive integer"
        }), 400

    command = [
        sys.executable,
        str(TOOLKIT_DIR / "wildfire.py"),
    ]

    if fire_starter:
        command.append("--start")

    if fire_cloud:
        command.append("--cloud")

    if fire_scanner:
        command.append("--scan")

    if scan_single_domain:
        try:
            fqdn = validate_domain(data.get("fqdn", ""))
        except ValueError as error:
            return jsonify({
                "error": str(error)
            }), 400

        command.extend([
            "--fqdn",
            fqdn,
            "--scanSingle",
        ])

    if not any([
        fire_starter,
        fire_cloud,
        fire_scanner,
        scan_single_domain,
    ]):
        return jsonify({
            "error": "Select at least one scan option"
        }), 400

    scan_obj.core_module = "wildfire.py"

    dry_run = data.get("dryRun", False)

    if not isinstance(dry_run, bool):
        return jsonify({
        "error": "dryRun must be a Boolean value"
    }), 400

    if dry_run:
        return jsonify({
        "message": "Dry run successful",
        "command": command,
    }), 200

    start_scan(
        fire_starter,
        fire_cloud,
        fire_scanner,
        domain_count,
        scan_obj.core_module,
    )

    try:
        completed_process = subprocess.run(
            command,
            cwd=TOOLKIT_DIR,
            check=True,
            shell=False,
        )

        return jsonify({
            "message": "Scan completed",
            "exit_code": completed_process.returncode,
        })

    except subprocess.CalledProcessError as error:
        return jsonify({
            "error": "Wildfire exited with an error",
            "exit_code": error.returncode,
        }), 500

    except OSError as error:
        return jsonify({
            "error": f"Unable to launch Wildfire: {error}"
        }), 500

    finally:
        stop_scan()

@app.route("/collect_sceenshots", methods=["POST"])
def collect_sceenshots():
    try:
        completed_process = subprocess.run(
            [
                sys.executable,
                str(TOOLKIT_DIR / "wildfire.py"),
                "--screenshots",
            ],
            cwd=TOOLKIT_DIR,
            check=True,
            shell=False,
        )

        return jsonify({
            "message": "Screenshot collection completed",
            "exit_code": completed_process.returncode,
        })

    except subprocess.CalledProcessError as error:
        return jsonify({
            "error": "Screenshot collection failed",
            "exit_code": error.returncode,
        }), 500

    except OSError as error:
        return jsonify({
            "error": f"Unable to launch Wildfire: {error}"
        }), 500

if __name__ == '__main__':
    # Loopback only, and no Werkzeug debugger unless asked for (BH_TOOLKIT_DEBUG=1):
    # the debugger runs arbitrary code for anyone who can reach it.
    app.run(
        host=os.environ.get("BH_TOOLKIT_HOST", "127.0.0.1"),
        port=int(os.environ.get("BH_TOOLKIT_PORT", "5000")),
        debug=os.environ.get("BH_TOOLKIT_DEBUG") == "1",
    )
