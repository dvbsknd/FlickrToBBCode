const inputField = document.getElementById("source_url");
const outputField = document.getElementById("output");
const sizeField = document.getElementById("preferred_size");
const imageField = document.getElementById("image-check");

const getID = url => {
  const regex = /https:\/\/www.flickr.com\/photos\/.+\/([\d]+)\/.+/g;
  return url.replace(regex, '$1');
}

const getTargetSize = () => {
  if (sizeField.value) return sizeField.value;
}

const getSizes = async imageID => {

  if (!imageID) throw new Error('No ID.');

  const endpoint = 'https://www.flickr.com/services/rest/?method=flickr.photos.getSizes';
  const apiKey = 'dd20bac905fda5be4080b8fb4b7459ff';
  const responseFormat = 'json';
  const fetchUrl = endpoint + '&api_key=' + apiKey + '&photo_id=' + imageID + '&format=' + responseFormat + '&nojsoncallback=1';

  let output = await fetch(fetchUrl, {mode: 'cors'})
    .then(response => { 
        if (response.ok) {
            // console.log(response.json());
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

const displayBBUrl = sizeUrl => {
  if (!sizeUrl) throw new Error('No URL provided.');
  imageField.src = sizeUrl;
  outputField.value = `[IMG]${sizeUrl}[/IMG]`;
  outputField.focus();
}

const runConversion = async () => {

  const url = inputField.value;
  const id = getID(url);
  const size = getTargetSize();
  const src = getSizeUrl(await getSizes(id),size);
  displayBBUrl(src);

}

inputField.addEventListener('input', runConversion, false);
sizeField.addEventListener('input', runConversion, false);
inputField.addEventListener('focus', (event) => event.target.setSelectionRange(0,event.target.value.length));
outputField.addEventListener('focus', (event) => event.target.setSelectionRange(0,event.target.value.length));