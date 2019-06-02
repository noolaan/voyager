/* Adopted from Discord.js */

const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

class Util {

    constructor() {
        throw new Error(`The ${this.constructor.name} class may not be instantiated.`);
    }

    static paginate(items, page = 1, pageLength = 10) {
        const maxPage = Math.ceil(items.length / pageLength);
        if(page < 1) page = 1;
        if(page > maxPage) page = maxPage;
        let startIndex = (page - 1) * pageLength;
        return {
            items: items.length > pageLength ? items.slice(startIndex, startIndex + pageLength) : items,
            page,
            maxPage,
            pageLength
        };
    }

    static mergeDefault(def, given) {
        if (!given) return def;
        for (const key in def) {
            if (!has(given, key) || given[key] === undefined) {
                given[key] = def[key];
            } else if (given[key] === Object(given[key])) {
                given[key] = Util.mergeDefault(def[key], given[key]);
            }
        }
        return given;
    }

    static delayFor(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    static fetchRecommendedShards(token, guildsPerShard = 1000) {
        if(!token) throw new Error("[util] Token missing.");
        return fetch("https://discordapp.com/api/v7/gateway/bot", {
            method: 'GET',
            headers: { Authorization: `Bot ${token.replace(/^Bot\s*/i, '')}` },
        }).then(res => {
            if (res.ok) return res.json();
            throw res;
        }).then(data => data.shards * (1000 / guildsPerShard));
    }

    static readdirRecursive(directory) {

        const result = [];

        (function read(directory) {
            const files = fs.readdirSync(directory);
            for(const file of files) {
                const filePath = path.join(directory, file);

                if(fs.statSync(filePath).isDirectory()) {
                    read(filePath);
                } else {
                    result.push(filePath);
                }
            }
        }(directory));

        return result;

    }

    static escapeMarkdown(text, onlyCodeBlock = false, onlyInlineCode = false) {
        if(onlyCodeBlock) return text.replace(/```/g, '`\u200b``');
        if(onlyInlineCode) return text.replace(/\\(`|\\)/g, '$1').replace(/(`|\\)/g, '\\$1');
        return text.replace(/\\(\*|_|`|~|\\)/g, '$1').replace(/(\*|_|`|~|\\)/g, '\\$1');
    }

}

module.exports = Util;