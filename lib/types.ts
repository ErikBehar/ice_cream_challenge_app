export type Classroom = {
  roomNumber: string;
  teacherName: string;
  studentCount: number;
  scoops: number;
};

export type Store = {
  lastUpdated: string;
  pageTitle: string;
  overallGoal: number;
  overallRaised: number;
  classroomPercentTarget: number;
  donationUrl: string;
  showIceCreamPoster: boolean;
  classrooms: Classroom[];
  /** Opaque hashes of family+classroom pairs already counted as a scoop. */
  seenDonors: string[];
  /** Opaque hashes of payment ids already added to the school total. */
  seenPayments: string[];
};

export type ClassroomCsvResult = {
  classrooms: number;
  warnings: string[];
};

export type DonationCsvResult = {
  classroomsUpdated: number;
  uniqueFamilies: number;
  duplicatesSkipped: number;
  warnings: string[];
};

export type ItemSummaryCsvResult = {
  overallRaised: number;
  itemsCounted: number;
  warnings: string[];
};

export type PaymentJsonResult = {
  overallRaised: number;
  amountAdded: number;
  duplicate: boolean;
};
