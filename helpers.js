function createGoogleSearchQuery(query) {
  // Replace spaces with '+' and encode the query
  const encodedQuery = encodeURIComponent(query.replace(/ /g, '+'));

  // Construct the Google search URL
  const googleSearchUrl = `https://www.google.com/search?q=${encodedQuery}`;

  return googleSearchUrl;
}

export const getPopupContent = (markerProperties) => {
  const { pflanzjahr, baumname_lat, baumname_deu } = markerProperties;

  const googleSearchLinkDeuName = createGoogleSearchQuery(baumname_deu);
  const googleSearchLinkLatName = createGoogleSearchQuery(baumname_lat);

  return `<a href='${googleSearchLinkLatName}' target='_blank'>${baumname_lat}</a><br>
  (<a href='${googleSearchLinkDeuName}' target='_blank'>${baumname_deu}</a> ${
    pflanzjahr ? ', ' + pflanzjahr : ''
  })`;
  //   return `${baumname_lat} (${baumname_deu} ${pflanzjahr ? ', ' + pflanzjahr : ''})`;
};
