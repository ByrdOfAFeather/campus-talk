const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();

async function getPostClassification(post) {
    // BASED ON GOOGLE'S TUTORIAL ON NATURAL LANGUAGE PROCESSING:
    // https://cloud.google.com/natural-language/docs/classifying-text#language-classify-content-nodejs
    const payload = {
        content: post.content,
        type: "PLAIN_TEXT"
    };

    const [results] = await client.classifyText({payload});
    return results;
}

function indexPosts(posts) {
    // BASED ON GOOGLE'S TUTORIAL ON NATURAL LANGUAGE PROCESSING:
    // CITATION: https://github.com/GoogleCloudPlatform/python-docs-samples/blob/bc1183e2c958a6e00fc3ad05bb74c3d2685cb264/language/classify_text/classify_text_tutorial.py#L68
    // (ORIGINAL VERSION IN PYTHON)
    // ORIGINAL TUTORIAL: https://cloud.google.com/natural-language/docs/classify-text-tutorial

    let indexes = {};
    for (let i = 0; i<posts.length; i++) {
        indexes[posts[i].title] = getPostClassification(posts[i]);
    }
}

function getNRandomPosts(n) {
    // TODO: Implementation
    return null;
}

function splitLabels(categories) {
    // BASED ON GOOGLE'S TUTORIAL ON NATURAL LANGUAGE PROCESSING:
    // CITATION:https://github.com/GoogleCloudPlatform/python-docs-samples/blob/bc1183e2c958a6e00fc3ad05bb74c3d2685cb264/language/classify_text/classify_text_tutorial.py#L98
    // (ORIGINAL VERSION IN PYTHON)
    // ORIGINAL TUTORIAL: https://cloud.google.com/natural-language/docs/classify-text-tutorial

    let returnVector = {};
    for (let i = 0; i < categories; i++) {
        let possibleCategories = categories[i].split("/");
        for (let j = 0; j < possibleCategories; j++) {
            if (possibleCategories[j]) {
                returnVector[possibleCategories[j]] = categories[i];
            }
        }
    }
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
    for (let i = 0; i<keysA.length; i++) {
        if(vectorizedB[keysA[i]] === undefined) {
            dotProd += 0;
        }
        else {
            dotProd += vectorizedB[keysA[i]];
        }
    }
    return dotProd;
}


function recommendPosts(post) {
    // BASED ON GOOGLE'S TUTORIAL ON NATURAL LANGUAGE PROCESSING:
    // CITATION:https://github.com/GoogleCloudPlatform/python-docs-samples/blob/bc1183e2c958a6e00fc3ad05bb74c3d2685cb264/language/classify_text/classify_text_tutorial.py#L128
    // (ORIGINAL VERSION IN PYTHON)
    // ORIGINAL TUTORIAL: https://cloud.google.com/natural-language/docs/classify-text-tutorial


    // returns the 5 most similar posts
    let posts = getNRandomPosts(5);
    posts.append(post);
    let indexes = indexPosts(posts);
    let postNames = Object.keys(indexes);

    let simmilars = [];
    for (let i = 0; i<postNames.length; i++) {
        simmilars.push(postNames[i], similarity(indexes[post.title], indexes[postNames[i]]));
    }

    simmilars = simmilars.sort((a, b) => b[1] - a[1]);

    // TODO: Take upvote count into account
    return simmilars.slice(0, 5);
}