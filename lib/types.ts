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
  classrooms: Classroom[];
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
