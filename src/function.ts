import express from 'express';
import * as request from 'request-promise';

let url: string;
const mode = process.env['MODE'] || 'local';
const port = process.env['PORT'] ? +process.env['PORT'] : 8080;
const project = process.env['GOOGLE_CLOUD_PROJECT'] || 'fibonacci-tracing';
switch (mode) {
  case 'local':
    url = `http://localhost:${port}`
    break;
  case 'gae':
    url = `https://${project}.appspot.com`;
    break;
  case 'gcf':
    console.log(JSON.stringify(process.env, null, 2));
    url = `https://us-central1-${project}.cloudfunctions.net/fibonacci`;
    break;
  default:
    throw new Error ("Unknown mode");
}

const func = async (req: express.Request, res: express.Response) => {
  if (typeof req.query.n === 'undefined' || req.query.n === null) {
    res.status(400).send('Missing query parameter "n"');
    return;
  }

  const n = +req.query.n;
  if (n == 0 || n == 1) {
    res.status(200).send('1');
    return;
  }
  try {
    const headers: {[key: string]:string} = {};
    let traceContext = req.header('X-Cloud-Trace-Context');
    if (typeof traceContext === 'string') {
      // Force Stackdriver tracing
      if (!traceContext.endsWith(';o=1')) {
        traceContext += ';o=1';
      }
      console.log("Forwarding trace context", traceContext);
      headers['X-Cloud-Trace-Context'] = traceContext;
    }  else {
      console.log("Didn't see X-Google-Trace-Context in", JSON.stringify(req.headers));
    }
    console.log("Sending headers", JSON.stringify(headers));
    const opts = headers === {} ? undefined : {headers};
    const requests = [request.get(`${url}?n=${n-1}`, opts), request.get(`${url}?n=${n-2}`, {headers})];
    const texts = await Promise.all(requests);
    const sum = +texts[0] + +texts[1];
    res.status(200).send(`${sum}`);
  } catch (err) {
    res.status(504).send(err);
  }
};

const trampoline = async (req: express.Request, res: express.Response) => {
  if (typeof req.query.n === 'undefined' || req.query.n === null) {
    res.status(400).send('Missing query parameter "n"');
    return;
  }

  const n = +req.query.n;
  try {
    const trampolined = await request.get(`${url}?n=${n}`);
    res.status(200).send(trampolined);
  } catch (err) {
    res.status(500).send(err);
  }
};

export {url, port, func, trampoline};
