import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import type { ShipmentEventPayload } from "@repo/api-types/events";
import { Job } from "bullmq";

@Injectable()
@Processor("notifications")
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<ShipmentEventPayload>) {
    this.logger.log(
      `Processed ${job.name} for ${job.data.trackingNo} with status ${job.data.status}`,
    );

    return await Promise.resolve({
      delivered: true,
      channel: "log",
    });
  }
}
