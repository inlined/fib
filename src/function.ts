import express from 'express';
import * as request from 'request-promise';

const host = process.env['HOST'] || 'http://localhost';
const port = process.env['PORT'] ? +process.env['PORT'] : 8080;
const url = `${host}:${port}/`;

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

export {host, port, func};
