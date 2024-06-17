<h1 align="center">
  <br>
  Bounty Hawk
  <br>
</h1>

<h4 align="center">A Modern, Agile Framework for Bug Bounty Hunting on Kali Linux</h4>



## About

**Bounty Hawk** is designed to provide aspiring Application Security Engineers with all the tools they need to leverage Bug Bounty hunting as a means to learn valuable, real-world AppSec concepts and make 💰 doing it!  My goal is to lower the barrier of entry for Bug Bounty hunting by providing easy-to-use automation tools in combination with educational content and how-to guides for a wide range of Web-based and Cloud-based vulnerabilities.  In combination with my YouTube content, this framework will help aspiring Application Security Engineers to quickly and easily understand real-world security concepts that directly translate to a high paying career in Cyber Security.  

In addition to using this tool for Bug Bounty Hunting, aspiring engineers can also use this Github Repository as a canvas to practice collaborating with other developers!  This tool was inspired by Metasploit and designed to be modular in a similar way.  Each Script (Ex: `wildfire.py` or `slowburn.py`) is basically an algorithm that runs the Modules (Ex: `fire-starter.py` or `fire-scanner.py`) in a specific patter for a desired result.  Because of this design, the community is free to build new Scripts to solve a specific use-case or Modules to expand the results of these Scripts.  By learning the code in this framework and using Github to contribute your own code, aspiring engineers will continue to learn real-world skills that can be applied on the first day of a Security Engineer I position.

My hope is that this modular framework will act as a canvas to help share what I've learned over my career to the next generation of Security Engineers!  Trust me, we need all the help we can get!!


## Quick Start

Paste this code block into a clean installation of [Kali Linux 2023.4](https://www.kali.org/get-kali/#kali-installer-images) to download, install, and run the latest stable Alpha version of the framework:
```
sudo apt update && sudo apt-get update
sudo apt -y upgrade && sudo apt-get -y upgrade
cd Bounty-Hawk
./install.sh
```



## Install

The **Bounty hawk** includes a script that installs all the necessary tools, packages, etc. that are needed to run the framework on a clean installation of [Kali Linux 2023.4](https://www.kali.org/get-kali/#kali-installer-images).


```
./install.sh
```

You will be prompted to enter various API keys and tokens when the installation begins.  **Entering these is not required to run the core functionality of the framework.  If you do not enter these API keys and tokens at the time of installation, simply hit enter at each of the prompts.  The keys can be added later to the `~/.keys` directory.  More information about how to add these keys manually can be found in the [Frequently Asked Questions](#faq) section of this README.** 

## Run the Web Application (Client and Server)

Once the installation is complete, you will be given the option to run the application by entering `Y`.  If you choose not the run the application immediately, or if you need to run the application after a reboot, simply navigate to the root directly and run the `run.sh` bash script.

```
./run.sh
```

## Core Modules

The Bounty Hawk's Core Modules are used to determine the basic scanning logic.  Each script is designed to support a specific recon methodology based on what the user is trying to accomplish.  

### Wildfire

At this time, the Wildfire script is the most widely used Core Module in the Bounty Hawk.  The purpose of this module is to allow the user to scan multiple targets that allow for testing on any subdomain discovered by the researcher.

How it works:

1. The user adds root domains through the Graphical User Interface (GUI) that they wish to scan for hidden subdomains
2. Wildfire sorts each of these domains based on the last time they were scanned to ensure the domain with the oldest data is scanned first
3. Wildfire scans each of the domains using the Sub-Modules based on the flags provided by the user.  

***Most Wildfire scans take between 8 and 48 hours to complete against a single domain if all Sub-Modules are being run.  Variations in this timing can be caused by a number of factors, including the target application and the machine running the framework.***  

***Also, please note that most data will not show in the GUI until the scan has completed.  It's best to try and run the scan overnight or over a weekend, depending on the number of domains being scanned, and return once the scan has complete to move from Recon to Enumeration.***

Running Wildfire:

#### Grahpical User Interface (GUI)

Wildfire can be run from the GUI using the Wildfire button on the dashboard. Once clicked, the front-end will use the checkboxes on the screen to determine what flags should be passed to the scanner.

*Please note that running scans from the GUI still has a few bugs and edge cases that haven't been sorted out.  If you have any issues, you can simply run the scan form the CLI.*

#### Command Line Interface (CLI)

All Core Modules for The Ars0n Framework are stored in the `/toolkit` directory.  Simply navigate to the directory and run `wildfire.py` with the necessary flags.  At least one Sub-Module flag must be provided.

```
python3 wildfire.py --start --cloud --scan
```

#### Slowburn

Unlike the Wildfire module, which requires the user to identify target domains to scan, the Slowburn module does that work for you.  By communicating with APIs for various bug bounty hunting platforms, this script will identify all domains that allow for testing on any discovered subdomain.  Once the data has been populated, Slowburn will randomly choose one domain at a time to scan in the same way Wildfire does.  

***Please note that the Slowburn module is still in development and is not considered part of the stable alpha release.  There will likely be bugs and edge cases encountered by the user.***

In order for Slowburn to identify targets to scan, it must first be initialized.  This initialization step collects the necessary data from various API's and deposits them into a JSON file stored locally.  Once this initialization step is complete, Slowburn will automatically begin selecting and scanning one target at a time.

To initalize Slowburn, simply run the following command:

```
python3 slowburn.py --initialize
```

Once the data has been collected, it is up to the user whether they want to re-initialize the tool upon the next scan.  

***Remember that the scope and targets on public bug bounty programs can change frequently.  If you choose to run Slowburn without initializing the data, you may be scanning domains that are no longer in scope for the program.  It is strongly recommended that Slowburn be re-initialized each time before running.***

If you choose not to re-initialize the target data, you can run Slowburn using the previously collected data with the following command:

```
python3 slowburn.py
```

## Sub-Modules

The Ars0n Framework's Sub-Modules are designed to be leveraged by the Core Modules to divide the Recon & Enumeration phases into specific tasks.  The data collected in each Sub-Module is used by the others to expand your picture of the target's attack surface.  

### Fire-Starter

Fire-Starter is the first step to performing recon against a target domain.  The goal of this script is to collect a wealth of information about the attack surface of your target.  Once collected, this data will be used by all other Sub-Modules to help the user identify a specific URL that is potentially vulnerable.

Fire-Starter works by running a series of open-source tools to enumerate hidden subdomains, DNS records, and the ASN's to identify where those external entries are hosted.  Currently, Fire-Starter works by chaining together the following widely used open-source tools:

- Amass
- Sublist3r
- Assetfinder
- Get All URL's (GAU)
- Certificate Transparency Logs (CRT)
- Subfinder
- ShuffleDNS
- GoSpider
- Subdomainizer

These tools cover a wide range of techniques to identify hidden subdomains, including web scraping, brute force, and crawling to identify links and JavaScript URLs.

***Once the scan is complete, the Dashboard will be updated and available to the user.***

**Most Sub-Modules in The Bounty Hawk requre the data collected from the Fire-Starter module to work.  With this in mind, Fire-Starter must be included in the first scan against a target for any usable data to be collected.**


### Fire-Scanner

Fire-Scanner uses the results of Fire-Starter and Fire-Cloud to perform [Wide-Band Scanning](https://www.linkedin.com/feed/update/urn:li:activity:6849314055283466240/) against all subdomains and cloud services that have been discovered from previous scans.

At this stage of development, this script leverages [Nuclei](https://github.com/projectdiscovery/nuclei) almost exclusively for all scanning.  Instead of simply running the tool, Fire-Scanner breaks the scan down into specific collections of [Nuclei Templates](https://github.com/projectdiscovery/nuclei-templates) and scans them one by one.  This strategy helps ensure the scans are stable and produce consistent results, removes any unnecessary or unsafe scan checks, and produces actionable results.

