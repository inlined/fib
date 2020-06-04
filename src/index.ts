import * as Tracer from '@google-cloud/trace-agent';
import express from 'express';
import {func, host, port} from './function';

Tracer.start();
const app = express();

app.get('/', func);

app.listen(port, () => {
  console.log(`server started at ${host}:${port}`);
});

