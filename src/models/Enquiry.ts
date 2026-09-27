import mongoose, { Schema, Document } from 'mongoose';

export interface IEnquiry extends Document {
  name: string;
  email: string;
  contactNumber: string;
  whatsappNumber?: string;
  standard?: string;
  schoolName?: string;
  message: string;
  createdAt: Date;
}

const EnquirySchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contactNumber: { type: String, required: true },
  whatsappNumber: { type: String, required: false },
  standard: { type: String, required: false },
  schoolName: { type: String, required: false },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Enquiry || mongoose.model<IEnquiry>('Enquiry', EnquirySchema);
