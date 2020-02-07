const rp = require('request-promise');
const request = require('request');
const fs = require('fs');

const API_KEY = 'AIzaSyBQMkuP1RTmJ9Vgn9z2PvjlijMC964YfTU';

function searchPoly( keyword, onLoad ) {

    var url = `https://poly.googleapis.com/v1/assets?keywords=${keyword}&format=OBJ&key=${API_KEY}`;

    rp(url, { json: true })
        .then(body => {
            body.assets.forEach(asset => {

                const gltfAssets = asset.formats.filter(format => {
                    return format.formatType === "GLTF2";
                }).map(item => {
                    console.log(item);
                    return { name: asset.name, root: item.root, resources: item.resources }
                });

                downloadAssets(keyword, gltfAssets);
            });
        });
}

function downloadAsset(url, filename) {
    console.log(`Downloading ${url}`);
    return new Promise(resolve => {
        request.get(url).pipe(fs.createWriteStream(filename))
        .on('close', resolve());
    });
}

async function downloadAssets(dirName, assets) {
    if (!fs.existsSync('assets')){
        fs.mkdirSync('assets');
    }
    assets.forEach( async asset => {
        if (!fs.existsSync('assets')) {
            fs.mkdirSync('assets');
        }

        const assetID = asset.name.split('/').pop();
        const assetDir = `assets/${assetID}`;

        if (!fs.existsSync(assetDir)) {
            fs.mkdirSync(assetDir);
        }

        downloadAsset(asset.root.url, `${assetDir}/${asset.root.relativePath}`);
        asset.resources.forEach(async resource => {
            const path = resource.relativePath.split('/').slice(0, -1);
            if (path.length) {
                const resourcePath = `assets/${assetID}/${path.join('/')}`;
                console.log(resourcePath);
                if (!fs.existsSync(resourcePath)) {
                    console.log("creating", resourcePath);
                    fs.mkdirSync(resourcePath, { recursive: true });
                }
            }
            await downloadAsset(resource.url, `${assetDir}/${resource.relativePath}`);
        })

    }); 
}

const keywords = process.argv.slice(2);

searchPoly(keywords);
