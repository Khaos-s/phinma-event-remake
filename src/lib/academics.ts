// College/program grouping: https://ui.phinma.edu.ph/academics/?tab=college-programs
export const colleges = [
  { code: "COM", name: "College of Management", courses: [
    { code: "BSHM", name: "BS Hospitality Management" },
    { code: "BSTM", name: "BS Tourism Management" },
    { code: "BSBA", name: "BS Business Administration" },
  ] },
  { code: "COA", name: "College of Accountancy", courses: [
    { code: "BSA", name: "BS Accountancy" },
    { code: "BSAIS", name: "BS Accounting Information System" },
  ] },
  { code: "COED", name: "College of Education", courses: [
    { code: "BEED", name: "Bachelor of Elementary Education" },
    { code: "BSED", name: "Bachelor of Secondary Education" },
    { code: "BSNED", name: "Bachelor of Special Needs Education" },
  ] },
  { code: "CCJE", name: "College of Criminal Justice Education", courses: [{ code: "BSCRIM", name: "BS Criminology" }] },
  { code: "COE", name: "College of Engineering", courses: [
    { code: "BSCE", name: "BS Civil Engineering" },
    { code: "BSME", name: "BS Mechanical Engineering" },
  ] },
  { code: "CAHS", name: "College of Allied Health Sciences", courses: [
    { code: "BSN", name: "BS Nursing" },
    { code: "BSP", name: "BS Pharmacy" },
    { code: "ABPSYCH", name: "BA Psychology" },
  ] },
  { code: "CITE", name: "College of Information Technology", courses: [{ code: "BSIT", name: "BS Information Technology" }] },
  { code: "CME", name: "College of Maritime Education", courses: [{ code: "BSMARE", name: "BS Marine Engineering" }] },
];

export function collegeLabel(department: string) {
  const college = colleges.find(item => item.name === department);
  return college ? `${college.code} · ${college.name}` : department;
}
