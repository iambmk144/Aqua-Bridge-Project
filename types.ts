export enum ShrimpGrade {
  GRADE_20 = '20 Count',
  GRADE_30 = '30 Count',
  GRADE_40 = '40 Count',
  GRADE_50 = '50 Count',
  GRADE_60 = '60 Count',
  GRADE_70 = '70 Count',
  GRADE_80 = '80 Count',
  GRADE_90 = '90 Count',
  GRADE_100 = '100 Count',
  GRADE_110 = '110 Count',
  GRADE_120 = '120 Count',
}

export interface ShrimpPrice {
  grade: ShrimpGrade;
  price: number;
  previousPrice?: number;
}

export enum MessageAuthor {
    USER = 'user',
    AI = 'ai',
}

export interface ChatMessage {
    author: MessageAuthor;
    text: string;
}

export type HarvestStatus = 'Pending Approval' | 'Finding Buyer' | 'Buyer Found' | 'Payment in Progress' | 'Completed' | 'Cancelled';

export interface HarvestRequest {
  id: string;
  farmerId: string; // To associate the request with a user
  grade: ShrimpGrade;
  quantity: string;
  location: string;
  status: HarvestStatus;
  timestamp: number;
}