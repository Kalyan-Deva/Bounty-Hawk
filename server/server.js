const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

const port = Number(process.env.BH_PORT) || 8000;
// Listen on loopback only. Set BH_HOST=0.0.0.0 deliberately if you need LAN access.
const host = process.env.BH_HOST || '127.0.0.1';

// Browser origins allowed to call the API. The Vite client (port 3000, or 4173
// for `vite preview`) proxies its requests, and they arrive with one of these.
const allowedOrigins = (process.env.BH_ALLOWED_ORIGINS ||
    'http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:4173,http://localhost:4173')
    .split(',').map((o) => o.trim()).filter(Boolean);

// Block cross-site requests: any other web page you visit could otherwise send
// form POSTs here (e.g. /api/log/delete). Requests without an Origin header,
// such as the toolkit's Python calls or curl, are allowed.
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: `Origin ${origin} is not allowed` });
    }
    next();
});
app.use(cors({ origin: allowedOrigins }));
app.use(express.urlencoded({extended: true}))
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

require('./config/mongoose.config');

require('./routes/Routes.js')(app);

app.listen(port, host, () => console.log(`Listening on http://${host}:${port}`) );
