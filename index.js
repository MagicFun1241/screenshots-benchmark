const fs = require('fs');
const path = require('path');

const config = require('./config.json');

const Queue = require('bull');

const screenshot1 = require('edge-js').func(path.join(__dirname, 'screenshot.cs'));
const screenshot2 = require('desktop-screenshot');
const screenshot3 = require('screenshot-desktop');

async function main() {
    const first = new Queue('test1', config.redis);
    first.process((job, done) => {
        screenshot1(0, async (err, res) => {
            if (job.data.latest === true) {
                console.timeEnd('window-screenshot');
                await first.close();
            }

            done(null);
        });
    });

    console.time('window-screenshot');
    for (let i = 0; i <= 60; i++) {
        first.add(i === 60 ? {latest: true} : undefined);
    }

    const second = new Queue('test2', config.redis);
    second.process((job, done) => {
        screenshot2("screenshot.png", async (error, complete) => {
            const data = fs.readFileSync('screenshot.png');
    
            if (job.data.latest === true) {
                console.timeEnd('desktop-screenshot');
                await second.close();
            }

            done(null);
        });
    });

    console.time('desktop-screenshot');
    for (let i = 0; i <= 60; i++) {
        second.add(i === 60 ? {latest: true} : undefined);
    }

    const third = new Queue('test3', config.redis);
    third.process((job, done) => {
        screenshot3().then(async (img) => {
            if (job.data.latest === true) {
                console.timeEnd('screenshot-desktop');
                await third.close();
            }

            done(null);
        });
    });

    console.time('screenshot-desktop');
    for (let i = 0; i <= 60; i++) {
        third.add(i === 60 ? {latest: true} : undefined);
    }
}

main();