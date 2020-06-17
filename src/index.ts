import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';
import {BatchSpanProcessor } from '@opentelemetry/tracing';
import { NodeTracerProvider } from '@opentelemetry/node';

const projectId = process.env['GOOGLE_PROJECT_ID'] || process.env['GOOGLE_CLOUD_PROJECT'];
let batchProcessor: BatchSpanProcessor;
if (projectId) {
  console.log("Setting up stackdriver exporting for OpenTelemetry on project " + projectId);
  // Use your existing provider
  const provider = new NodeTracerProvider();
  provider.register();

  // Initialize the exporter
  const exporter = new TraceExporter({projectId: projectId});

  // Not a batch exporter to avoid a batch not flushing in time.
  batchProcessor = new BatchSpanProcessor(exporter);
  provider.addSpanProcessor(batchProcessor);
}

import express from 'express';
import {func, trampoline, url, port} from './function';
export {func, trampoline};

if (require.main === module) {
  const app = express();

  app.get('/', func);
  app.get('/flush', function(_, res) {
    if (batchProcessor) {
      batchProcessor.forceFlush();
      res.send("Flushed");
    } else {
      res.send("Nothing ot flush");
    }
  });

  app.listen(port, () => {
    console.log(`server started at ${url}`);
  });
}
