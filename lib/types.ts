export type Classroom = {
  roomNumber: string;
  teacherName: string;
  studentCount: number;
  scoops: number;
};

export type Store = {
  lastUpdated: string;
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
  overallRaised: number;
  classroomsUpdated: number;
  uniqueFamilies: number;
  duplicatesSkipped: number;
  amountsApplied: boolean;
  warnings: string[];
};
