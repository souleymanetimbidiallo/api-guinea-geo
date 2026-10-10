const activeFilter = { administrativeStatus: { $ne: 'historical' } };
const prefectureFilter = { ...activeFilter, administrativeType: { $ne: 'special-zone' } };
module.exports = { activeFilter, prefectureFilter };
