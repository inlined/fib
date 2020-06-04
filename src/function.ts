import express from 'express';
import * as request from 'request-promise';

let url: string;
const mode = process.env['MODE'] || 'local';
const port = process.env['PORT'] ? +process.env['PORT'] : 8080;
switch (mode) {
  case 'local':
    url = `http://localhost:${port}`
    break;
  case 'gae':
    url = `https://${process.env['GOOGLE_CLOUD_PROJECT']}.appspot.com`;
    break;
  case 'functions':
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
    const requests = [request.get(`${url}?n=${n-1}`), request.get(`${url}?n=${n-2}`)];
    const texts = await Promise.all(requests);
    const sum = +texts[0] + +texts[1];
    res.status(200).send(`${sum}`);
  } catch (err) {
    res.status(504).send(err);
  }
};

export {url, port, func};
