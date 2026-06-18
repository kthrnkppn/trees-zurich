function createGoogleSearchQuery(query) {
  // Replace spaces with '+' and encode the query
  const encodedQuery = encodeURIComponent(query.replace(/ /g, '+'));

  // Construct the Google search URL
  const googleSearchUrl = `https://www.google.com/search?q=${encodedQuery}`;

  return googleSearchUrl;
}

export const getPopupContent = (markerProperties) => {
  const { pflanzjahr, baumname_lat, baumname_deu } = markerProperties;

  // German name first (bold), Latin name in parentheses (italic), then the
  // planting year. Both names link to a Google search. Falls back gracefully if
  // one of the names is missing.
  const deu = baumname_deu
    ? `<a href='${createGoogleSearchQuery(baumname_deu)}' target='_blank' rel='noopener'>${baumname_deu}</a>`
    : '';
  const lat = baumname_lat
    ? `<a href='${createGoogleSearchQuery(baumname_lat)}' target='_blank' rel='noopener'><em>${baumname_lat}</em></a>`
    : '';
  const year = pflanzjahr ? `gepflanzt ${pflanzjahr}` : '';

  const heading = deu || lat || 'Unbekannter Baum';
  const detail = [deu ? lat : '', year].filter(Boolean).join(', ');

  return `<strong>${heading}</strong>${detail ? `<br>${detail}` : ''}`;
};
