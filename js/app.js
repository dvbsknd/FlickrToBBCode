// Set variables for relevant page elements
const apiKeyField = document.getElementById("api_key");
const inputField = document.getElementById("source_url");
const outputField = document.getElementById("output");
const sizeField = document.getElementById("preferred_size");
const imageField = document.getElementById("image-check");

// Use Regex to extract the photo's ID from a Flickr photo page URL
const getID = url => {
  const setRegex = /https:\/\/www.flickr.com\/photos\/.+\/sets\/([\d]+).*/g;
  const imgRegex = /https:\/\/www.flickr.com\/photos\/.+\/([\d]+).*/g;
  if (url.replace(setRegex, '$1') !== url) { return url.replace(setRegex, '$1') };
  if (url.replace(imgRegex, '$1') !== url) { return url.replace(imgRegex, '$1') };
}

// Get all available image sizes for the photo from the Flickr API as JSON
const getData = async (assetID, apiMethod, apiKey) => {

  if (!assetID || !apiMethod || !apiKey) throw new Error('Missing parameter.');

  var method;
  var asset;

  switch (apiMethod) {
    case 'getSizes':
    case 'getInfo':
      method = `flickr.photos.${apiMethod}`;
      asset = '&photo_id=' + assetID;
      break;
    case 'getPhotos':
      method = `flickr.photoSets.${apiMethod}`;
      asset = '&photoset_id=' + assetID;
      break;
  }

  const endpoint = 'https://www.flickr.com/services/rest/';
  const key = getApiKey();
  const responseFormat = 'json';
  const fetchUrl = endpoint 
    + '?method=' + method 
    + '&api_key=' + apiKey 
    + asset
    + '&format=' + responseFormat 
    + '&nojsoncallback=1';

  let output = await fetch(fetchUrl, {mode: 'cors'})
    .then(response => { 
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Unexpected response.')
        }
    })
    .then(data => { 
      if (data.code === 1) throw new Error('The photo id passed was not a valid photo id.');
      return data; 
    });

  return output;

}

// Retrieve the user's API Key
const getApiKey = () => {
  if (apiKeyField.value) {
    localStorage.setItem('apiKey', apiKeyField.value);
  } else {
    apiKeyField.value = localStorage.getItem('apiKey');
  }
  return apiKeyField.value;
}

// Retrieve the user's preferred size from their selection
const getTargetSize = () => {
  if (sizeField.value) {
    localStorage.setItem('imgSize', sizeField.value);
  } else {
    sizeField.value = localStorage.getItem('imgSize');
  }
  return sizeField.value;
}

// Get the image URL for the preferred image size from the available sizes
const getSizeUrl = (imageSizes, targetSize) => {
  if (imageSizes.sizes && targetSize) { 
      const sizes = imageSizes.sizes.size;
      const source = sizes.find(size => {
          if (size.label === targetSize) {
              return size;
          }
      }).source;
      return source;
  } else {
      throw new Error('Not found!')
  }
}

// Get the title property from the returned JSON and output a string
const getTitle = data => {
    return data.photo.title._content.trim() || '';
}

// Get the description property from the returned JSON and output a string
const getDescription = data => {
    return data.photo.description._content.trim() || '';
}

// Display the final image URL as BBCode and as a preview image on the page
const renderOne = (imgSrc, imgCaption) => {
  if (!imgSrc) throw new Error('No URL provided.');
  imageField.src = imgSrc;
  outputField.value = `[IMG]${imgSrc}[/IMG]\n[I]${imgCaption}[/I]\n\n`;
  outputField.focus();
}

// A temporary function to render a set of images, which should be merged with the above
const renderSet = async setData => {
  const photos = setData.photoset.photo;
  console.log(photos);
  const size = getTargetSize();
  outputField.value = '';
  for (let i = 0; i < photos.length; i++) {
    console.log(i, ' of ', photos.length, photos[i].id);
    const photo = photos[i];
    const src = getSizeUrl(await getData(photo.id, 'getSizes', getApiKey()), size);
    const title = getTitle(await getData(photo.id, 'getInfo', getApiKey()));
    const desc = getDescription(await getData(photo.id, 'getInfo', getApiKey()));
    outputField.value += `[IMG]${src}[/IMG]\n[I]${title}`
    if (desc) outputField.value += ` - ${desc}`;
    outputField.value += `[/I]\n\n`;
  }
}

// Run the conversion steps once a URL is provided on the page
const runConversion = async () => {

  const url = inputField.value;
  const id = getID(url);
  if (id.type === 'image') {
    const size = getTargetSize();
    const src = getSizeUrl(await getData(id, 'getSizes', getApiKey()), size);
    const caption = getDescription(await getData(id, 'getInfo', getApiKey()));
    render(src, caption);
  } else {
    renderSet(await getData(id, 'getPhotos', getApiKey()));
  }

}

// Set event listeners on various page elements to trigger conversion and display
inputField.addEventListener('input', runConversion, false);
sizeField.addEventListener('input', runConversion, false);
inputField.addEventListener('focus', (event) => event.target.setSelectionRange(0,event.target.value.length));
outputField.addEventListener('focus', (event) => event.target.setSelectionRange(0,event.target.value.length));
