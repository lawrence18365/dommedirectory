const locations = [
  { id: 1, city: 'Toronto', state: 'Ontario', country: 'Canada' },
  { id: 2, city: 'Vancouver', state: 'British Columbia', country: 'Canada' },
  { id: 3, city: 'Los Angeles', state: 'California', country: 'United States' }
];
const selectHtml = locations.map(loc => `<option value="${loc.id}">${loc.city}, ${loc.state}, ${loc.country}</option>`).join('\n');
console.log(selectHtml);
