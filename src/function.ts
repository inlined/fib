import express from 'express';
import * as request from 'request-promise';

const port = process.env['PORT'] ? +process.env['PORT'] : 8080;
async function url() {
  try {
    let hostname = await request.get(
      'http://metadata.google.internal/computeMetadata/v1/instance/hostname', {
      headers: {'Metadata-Flavor': 'Google'},
      simple: true,  // throw on 404
    });
    // Some ISPs' DNS never 404; they serve some BS advertisement instead
    if (hostname.includes('<html>')) {
      throw "Bullshit ISP";
    }
    console.log(`hostname  is ${hostname}`);
    return `https://${hostname}`;
  } catch {
    console.log('Failed to get hostname; assuming localhost');
    return `http://localhost:${port}`;
  }
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
      console.log("Didn't see X-Google-Trace-Context");
    }
    const opts = headers === {} ? undefined : {headers};
    const uri = await url();
    const requests = [request.get(`${uri}?n=${n-1}`, opts), request.get(`${uri}?n=${n-2}`, opts)];
    const texts = await Promise.all(requests);
    const sum = +texts[0] + +texts[1];
    res.status(200).send(`${sum}`);
  } catch (err) {
    res.status(504).send(err);
  }
};

export {port, func};
