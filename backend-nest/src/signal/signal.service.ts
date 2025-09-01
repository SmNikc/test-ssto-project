import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Request } from '../models/request.model';
import { Vessel } from '../models/vessel.model';

@Injectable()
export class SignalService {
  constructor(
    @InjectModel(Request)
    private requestModel: typeof Request,
    @InjectModel(Vessel)
    private vesselModel: typeof Vessel,
  ) {}

  async findRequestById(id: string | number) {
    return await this.requestModel.findByPk(id, {
      include: [{ model: Vessel, as: 'vessel' }],
    });
  }

  async findAllRequests(query: any = {}) {
    return await this.requestModel.findAll({
      where: query.status ? { status: query.status } : {},
      include: [{ model: Vessel, as: 'vessel' }],
      order: [['createdAt', 'DESC']],
    });
  }

  async createRequest(data: any) {
    return await this.requestModel.create(data);
  }

  async updateRequestStatus(id: string | number, status: string) {
    const request = await this.findRequestById(id);
    if (!request) return null;
    request.status = status;
    await request.save();
    return request;
  }

  // findOne принимает number или string
  async findOne(id: string | number) {
    return await this.findRequestById(id);
  }

  // processEmailSignal принимает объект с полями
  async processEmailSignal(emailData: {
    from: string;
    text: string;
    date: Date;
    messageId: string;
    subject?: string;
    vesselId?: number;
    type?: string;
  }) {
    try {
      const newRequest = await this.createRequest({
        vesselId: emailData.vesselId || null,
        type: emailData.type || 'EMAIL_SIGNAL',
        status: 'PENDING',
        description: emailData.subject || emailData.text.substring(0, 100),
        data: {
          from: emailData.from,
          text: emailData.text,
          date: emailData.date,
          messageId: emailData.messageId,
        },
        createdAt: new Date(),
      });

      return {
        success: true,
        requestId: newRequest.id,
        id: newRequest.id,
        status: newRequest.status,
        message: 'Signal processed from email',
      };
    } catch (error) {
      console.error('Error processing email signal:', error);
      throw error;
    }
  }
}
