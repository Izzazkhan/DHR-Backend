const searchStaff = (req, staff) => {
  const arr = [];
  for (let i = 0; i < staff.length; i++) {
    const fullName = staff[i].name[0].given[0] + ' ' + staff[i].name[0].family;
    if (
      (staff[i].name[0].given[0] &&
        staff[i].name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (staff[i].name[0].family &&
        staff[i].name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (staff[i].identifier[0].value &&
        staff[i].identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (staff[i].telecom[1].value &&
        staff[i].telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (staff[i].nationalID &&
        staff[i].nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(staff[i]);
    }
  }

  return arr;
};

module.exports = searchStaff;
