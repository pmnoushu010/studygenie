import mongoose, { Schema, Document } from 'mongoose';

export interface IChapterQuestion extends Document {
  subject: string;
  folder: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

const ChapterQuestionSchema: Schema = new Schema(
  {
    subject: { type: String, required: true },
    folder: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

// Create a compound index for subject and folder, so we can easily query and upsert
ChapterQuestionSchema.index({ subject: 1, folder: 1 }, { unique: true });

export default mongoose.models.ChapterQuestion ||
  mongoose.model<IChapterQuestion>('ChapterQuestion', ChapterQuestionSchema);
