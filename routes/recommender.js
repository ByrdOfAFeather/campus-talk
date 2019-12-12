import express from "express";

const {privateStore} = require('../data/DataStore');
const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient({keyFilename: "C:\\Users\\matth\\Documents\\Test\\comp426-backend\\campusTalk-3b14b257405b.json"});

async function getPostClassification(post) {
    // BASED ON GOOGLE'S TUTORIAL ON NATURAL LANGUAGE PROCESSING:
    // https://cloud.google.com/natural-language/docs/classifying-text#language-classify-content-nodejs

    const document = {
        content: post[0].content,
        type: "PLAIN_TEXT"
    };

    const [results] = await client.classifyText({document: document});

    if (results.statusCode === 400) {
        return null;
    } else {
        return results;
    }
}

async function indexPosts(posts) {
    // BASED ON GOOGLE'S TUTORIAL ON NATURAL LANGUAGE PROCESSING:
    // CITATION: https://github.com/GoogleCloudPlatform/python-docs-samples/blob/bc1183e2c958a6e00fc3ad05bb74c3d2685cb264/language/classify_text/classify_text_tutorial.py#L68
    // (ORIGINAL VERSION IN PYTHON)
    // ORIGINAL TUTORIAL: https://cloud.google.com/natural-language/docs/classify-text-tutorial

    let indexes = {};
    for (let i = 0; i < posts.length; i++) {
        indexes[posts[i][0].id] = await getPostClassification(posts[i]);
        if (indexes[posts[i][0].id] === null) {
            return null;
        }
    }
    return indexes
}

function getNRandomPosts(n, avoidID) {
    let allPosts = privateStore.get("posts");
    if (allPosts.length - 1 < n) {
        return allPosts;
    } else {
        let shallow = [];
        let keys = Object.keys(allPosts);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] !== avoidID) {
                let current = allPosts[keys[i]];
                current.id = keys[i];
                shallow.push(current);
            }
        }
        let posts = [];
        for (let i = 0; i < n; i++) {
            if (keys[i] !== avoidID) {
                let randIndex = Math.floor(Math.random() * (shallow.length - 1));
                posts.push(shallow.splice(randIndex, 1));
            }
        }
        return posts
    }
}

function splitLabels(categories) {
    // BASED ON GOOGLE'S TUTORIAL ON NATURAL LANGUAGE PROCESSING:
    // CITATION:https://github.com/GoogleCloudPlatform/python-docs-samples/blob/bc1183e2c958a6e00fc3ad05bb74c3d2685cb264/language/classify_text/classify_text_tutorial.py#L98
    // (ORIGINAL VERSION IN PYTHON)
    // ORIGINAL TUTORIAL: https://cloud.google.com/natural-language/docs/classify-text-tutorial

    let returnVector = {};
    for (let i = 0; i < categories.length; i++) {
        let possibleCategories = categories[i].split("/");
        for (let j = 0; j < possibleCategories; j++) {
            if (possibleCategories[j]) {
                returnVector[possibleCategories[j]] = categories[i];
            }
        }
    }
    return returnVector
}

function similarity(categoriesA, categoriesB) {
    // BASED ON GOOGLE'S TUTORIAL ON NATURAL LANGUAGE PROCESSING:
    // CITATION:https://github.com/GoogleCloudPlatform/python-docs-samples/blob/bc1183e2c958a6e00fc3ad05bb74c3d2685cb264/language/classify_text/classify_text_tutorial.py#L128
    // (ORIGINAL VERSION IN PYTHON)
    // ORIGINAL TUTORIAL: https://cloud.google.com/natural-language/docs/classify-text-tutorial

    let vectorizedA = splitLabels(categoriesA);
    let vectorizedB = splitLabels(categoriesB);

    let normalA = 0;
    let keysA = Object.keys(vectorizedA);
    for (let i = 0; i < keysA.length; i++) {
        normalA += vectorizedA[keysA[i]] ** 2;
    }
    normalA = Math.sqrt(normalA);

    let normalB = 0;
    let keysB = Object.keys(vectorizedB);
    for (let i = 0; i < keysB.length; i++) {
        normalB += vectorizedB[keysB[i]] ** 2;
    }
    normalB = Math.sqrt(normalA);

    if (normalA === 0 || normalB === 0) {
        return 0;
    }

    let dotProd = 0;
    for (let i = 0; i < keysA.length; i++) {
        if (vectorizedB[keysA[i]] === undefined) {
            dotProd += 0;
        } else {
            dotProd += vectorizedB[keysA[i]];
        }
    }
    return dotProd;
}

export const router = express.Router();
export const prefix = '/';

router.post('/reccomend', function (req, res) {
    console.log("I got here");
    let id = Math.floor(Math.random() * 10000);
    recommendPosts(req.body.data.post, id);
    res.send({id: id});
});

async function recommendPosts(post, id) {
    // BASED ON GOOGLE'S TUTORIAL ON NATURAL LANGUAGE PROCESSING:
    // CITATION:https://github.com/GoogleCloudPlatform/python-docs-samples/blob/bc1183e2c958a6e00fc3ad05bb74c3d2685cb264/language/classify_text/classify_text_tutorial.py#L128
    // (ORIGINAL VERSION IN PYTHON)
    // ORIGINAL TUTORIAL: https://cloud.google.com/natural-language/docs/classify-text-tutorial

    try {
        // returns the 5 most similar posts
        let posts = getNRandomPosts(5, post.id);
        posts.push([post]);
        let indexes = await indexPosts(posts);
        if (indexes == null) {
            return null;
        }
        let postNames = Object.keys(indexes);

        let simmilars = [];
        for (let i = 0; i < postNames.length; i++) {
            console.log(i);
            simmilars.push(postNames[i], similarity(indexes[post.id], indexes[postNames[i]]));
        }

        simmilars = simmilars.sort((a, b) => b[1] - a[1]);
        // TODO: Take upvote count into account
        console.log(simmilars);
        privateStore["set"](`results.${id}`, {simmilars: simmilars})
    } catch (e) {
        privateStore["set"](`results.${id}`, {simmilars: "error"})
    }
}