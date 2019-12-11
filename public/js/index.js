function debouncer(debouncee, debounceeArgs, time) {
    let currentCallbackID = null;
    return function () {
        if (currentCallbackID === null) {
            debouncee(debounceeArgs);
            currentCallbackID = setTimeout(function () {
                currentCallbackID = null;
            }, time);
        }
    }
}

function searchPosts() {
    let searchInput = $("#search").val();
    axios.get("http://localhost:3000/private/posts", {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("apiKey")}`
        }
    }).then(function (result) {
        let posts = result.data.result;

        let searchablePosts = [];
        let keys = Object.keys(posts);
        for (let i = 0; i < keys.length; i++) {
            let pushable = posts[keys[i]];
            pushable.id = keys[i];
            searchablePosts.push(pushable);
        }

        searchablePosts = searchablePosts.filter((post) => post.title.startsWith(searchInput));
        console.log(searchablePosts);
    })
}


function cleanUpModal() {
    $("#modal-content-container").empty();
    $("#generic-input-modal").removeClass("is-active");
}


function createAccountPopUp() {
    let form = $(`
    <form class="form" onsubmit="return false;">
        <div class="field">
            <label class="label has-text-white">Username</label>
            <div class="control">
                <input id="username-input" class="input">
            </div>
        </div>
    
        <div class="field">
            <label class="label has-text-white">Password</label>
            <div class="control">
                <input id="password-input" class="input">
            </div>
        </div>
    
        <div id="email-input-field" class="field">
            <label class="label has-text-white">Email</label>
            <div class="control">
                <input id="email-input" class="input">
            </div>
        </div>
        <div class="level">
            <div class="level-left">
                <button id="cancel-button" class="button">Cancel</button>
            </div>
            <div class="level-right">
                <button id="submit-button" class="button disabled">Submit</button>
            </div>
        </div>
    </form>
    `);

    let container = $("#modal-content-container");
    let modal = $("#generic-input-modal");

    container.append(form);
    let usernameInput = $("#username-input");
    let passwordInput = $("#password-input");
    let emailInput = $("#email-input");

    let validate = () => {
        let usernameInputValue = usernameInput.val();
        let passwordInputValue = passwordInput.val();
        let emailInputValue = emailInput.val();
        return !(usernameInputValue.length === 0 || passwordInputValue.length === 0 || emailInputValue.length === 0);
    };

    let submitNewAccount = () => {
        $.ajax({
            url: "http://localhost:3000/account/create",
            method: "POST",
            data: {
                name: usernameInput.val(),
                pass: passwordInput.val(),
            },
            success: function (result) {
                cleanUpModal();

                $.ajax({
                    url: "http://localhost:3000/account/login",
                    method: "POST",
                    data: {
                        name: usernameInput.val(),
                        pass: passwordInput.val(),
                    },
                    success: function (result) {
                        window.localStorage.setItem("apiKey", result.jwt);
                        let id = Math.floor(Math.random() * 100000);
                        window.localStorage.setItem("userID", id);
                        axios.post(`http://localhost:3000/private/users/${id}`, {
                            data: {
                                username: usernameInput.val(),
                                posts: [],
                                likedPosts: [],
                                postsCommentedOn: [],
                                numberOfLikes: 0,
                            },
                        }, {
                            headers: {
                                "Authorization": `Bearer ${localStorage.getItem("apiKey")}`
                            },
                        }).then((_) => {
                            window.location.reload();
                        });
                    },
                    error: function (result) {
                        console.log("Somehow I failed to login someone!");
                        console.log(result);
                    }
                });


            },
            error: function (result) {
                let error = result.data.error;
                console.log(error);
            }
        })
    };

    let updateIfValid = () => {
        let valid = validate();
        if (valid) {
            $("#submit-button").removeClass("disabled");
            $("#submit-button").on("click", submitNewAccount);
        } else {
            $("#submit-button").addClass("disabled");
            $("#submit-button").off();
        }
    };

    form.on('input', "#username-input", updateIfValid);
    form.on('input', "#password-input", updateIfValid);
    form.on('input', "#email-input", updateIfValid);

    $("#cancel-button").on("click", cleanUpModal);
    modal.addClass("is-active");
}


async function getUserName() {
    let result = await $.ajax({
        url: "http://localhost:3000/account/status",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("apiKey")}`
        }
    });
    return result.user.name;
}

async function getUserPosts(userID) {
    let response = await axios.get(`http://localhost:3000/private/users/${userID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    return response.data.result.posts;
}

async function getUserComments(userID) {
    let response = await axios.get(`http://localhost:3000/private/users/${userID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    console.log(response.data);
    return response.data.result["postsCommentedOn"];
}

async function getPostComments(postID) {
    let response = await axios.get(`http://localhost:3000/private/posts/${postID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    return response.data.result.comments;
}


async function getCommentObjectsFromPost(postID) {
    let response = await axios.get(`http://localhost:3000/private/posts/${postID}/comments`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let comments = response.data.result;

    let commentObjects = [];
    for (let i = 0; i < comments.length; i++) {
        let curRequest = await axios.get(`http://localhost:3000/private/comments/${comments[i]}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
        let result = curRequest.data.result;
        result["id"] = comments[i];
        commentObjects.push(curRequest.data.result);
    }

    return commentObjects;
}

async function getCommentObjectsFromUser(userID) {
    let response = await axios.get(`http://localhost:3000/private/users/${userID}/postsCommentedOn`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let comments = response.data.result;

    let commentObjects = [];
    for (let i = 0; i < comments.length; i++) {
        let curRequest = await axios.get(`http://localhost:3000/private/comments/${comments[i]}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
        let result = curRequest.data.result;
        result["id"] = comments[i];
        commentObjects.push(curRequest.data.result);
    }

    return commentObjects;
}

async function deleteComment(commentID) {
    let commentObjectRequest = await axios.get(`http://localhost:3000/private/comments/${commentID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let commentObject = commentObjectRequest.data.result;

    let comments = await getPostComments(commentObject.postID);

    let foundIndexPosts = null;
    comments.find(function (value, index) {
        if (`${value}` === `${commentID}`) {
            foundIndexPosts = index;
            return true;
        } else {
            return false;
        }
    });
    if (foundIndexPosts !== null) {
        comments.splice(foundIndexPosts, 1);
    }

    await axios.post(`http://localhost:3000/private/posts/${commentObject.postID}/comments`, {
        "data": comments,
    }, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("apiKey")
        }
    });

    let userComments = await getUserPosts(commentObject.author);

    let foundIndex = null;
    userComments.find(function (value, index) {
        if (`${value}` === `${commentID}`) {
            foundIndex = index;
            return true;
        } else {
            return false;
        }
    });

    if (foundIndex !== null) {
        userComments.splice(foundIndex, 1);
    }

    await axios.post(`http://localhost:3000/private/users/${localStorage.getItem("userID")}/postsCommentedOn`, {
        "data": userComments,
    }, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("apiKey")
        }
    });

    let deleteRequest = await axios.delete(`http://localhost:3000/private/comments/${commentID}`,
        {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
}

async function deleteCommentsFromPost(commentIDs) {
    for (let i = 0; i < commentIDs.length; i++) {
        let currentCommentObjectRequest = await axios.get(`http://localhost:3000/private/comments/${commentIDs[i]}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
        let currentCommentObject = currentCommentObjectRequest.data.result;
        let userComments = await getUserPosts(currentCommentObject.author);

        let foundIndex = null;
        userComments.find(function (value, index) {
            if (`${value}` === `${commentIDs[i]}`) {
                foundIndex = index;
                return true;
            } else {
                return false;
            }
        });

        if (foundIndex !== null) {
            userComments.splice(foundIndex, 1);
        }

        await axios.post(`http://localhost:3000/private/users/${currentCommentObject.author}/postsCommentedOn`, {
            "data": userComments,
        }, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("apiKey")
            }
        });

        let deleteRequest = await axios.delete(`http://localhost:3000/private/comments/${commentID}`,
            {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    }
}

async function deletePost(postID) {
    let postObjectRequest = await axios.get(`http://localhost:3000/private/posts/${postID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let postObject = postObjectRequest.data.result;

    await deleteCommentsFromPost(postObject.comments);

    // let currentUserObjectRequest = await axios.get(`http://localhost:3000/private/users/${localStorage.getItem("userID")}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    // let currentUserObject = currentUserObjectRequest.data.result;
    let userPosts = await getUserPosts(postObject.author);

    let foundIndex = null;
    userPosts.find(function (value, index) {
        if (`${value}` === `${postID}`) {
            foundIndex = index;
            return true;
        } else {
            return false;
        }
    });

    if (foundIndex !== null) {
        userPosts.splice(foundIndex, 1);
    }

    await axios.post(`http://localhost:3000/private/users/${localStorage.getItem("userID")}/posts`, {
        "data": userPosts,
    }, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("apiKey")
        }
    });

    let deleteRequest = await axios.delete(`http://localhost:3000/private/posts/${postID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    loadContent();
}

async function createNewComment() {
    //TODO ACTUALLY GET INPUT
    let postID = 58532;
    let comment = "This is a comment";
    let id = Math.floor(Math.random() * 100000);

    let result = await axios.post(`http://localhost:3000/private/comments/${id}/`, {
        data: {
            postID: postID,
            author: localStorage.getItem("userID"),
            date: Date(),
            comment: comment,
        }
    }, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("apiKey")}`
        },
    });

    if (result.status === 200) {
        let comments = await getUserComments(localStorage.getItem("userID"));
        let commentsViaPosts = await getPostComments(postID);

        axios.post(`http://localhost:3000/private/users/${localStorage.getItem("userID")}/postsCommentedOn`, {
            "data": id,
            type: "merge"
        }, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("apiKey")
            }
        });

        axios.post(`http://localhost:3000/private/posts/${postID}/comments`, {
            "data": id,
            type: "merge"
        }, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("apiKey")
            }
        });
    }
}


function createNewPost() {
    let form = $(`
            <form id="new-post-form" class="form" onsubmit="return false;">
                <div class="field">
                    <label class="label">Post Title</label>
                    <div class="control">
                        <input id="title-input" class="input">
                    </div>
                </div>
            
                <div class="field">
                    <label class="label">What do you want to say?</label>
                    <div class="control">
                        <textarea id="content-input" class="textarea"></textarea>
                    </div>
                </div>
                
                <div class="level">
                    <div class="level-left">
                        <button id="post-cancel" class="button">Cancel</button>
                    </div>
                    <div class="level-right">
                        <button id="post-submit" class="button">Submit</button>
                    </div>
                </div>
            </form>
    `);

    let newPostContainer = $("#new-post-container");
    newPostContainer.append(form);

    let titleInput = $("#title-input");
    let contentInput = $("#content-input");

    let validate = () => {
        let titleInputValue = titleInput.val();
        let contentInputValue = contentInput.val();
        return !(titleInputValue === 0 || contentInputValue === 0);
    };

    $("#post-cancel").on("click", function () {
        newPostContainer.empty();
        newPostContainer.hide();
    });

    $("#post-submit").on("click", async function () {
        let id = Math.floor(Math.random() * 100000);
        let validated = validate();
        if (validated) {
            let result = await axios.post(`http://localhost:3000/private/posts/${id}/`, {
                data: {
                    title: titleInput.val(),
                    content: contentInput.val(),
                    author: localStorage.getItem("userID"),
                    date: Date(),
                    numberOfLikes: 0,
                    comments: [],
                    usersWhoLikedThePost: [],
                }
            }, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("apiKey")}`
                },
            });

            if (result.status === 200) {
                $("#new-post-form").remove();
                loadContent();
                let userPosts = await getUserPosts(localStorage.getItem("userID"));
                console.log(userPosts);
                userPosts.push(id);
                await axios.post(`http://localhost:3000/private/users/${localStorage.getItem("userID")}/posts`, {
                    "data": userPosts,
                    type: "merge"
                }, {
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("apiKey")
                    }
                });
            } else {
                // TODO ERROR
            }
        } else {
            //TODO ERROR
        }
    });

    newPostContainer.slideDown(500);
}

async function getRandomContent(numberOfPosts) {
    let content = await axios.get("http://localhost:3000/private/posts", {
        headers: {"Authorization": `Bearer ${localStorage.getItem("apiKey")}`},
    });
    let keys = Object.keys(content.data.result);

    let endResult = [];
    if (keys.length > numberOfPosts) {
        for (let i = 0; i < numberOfPosts; i++) {
            let index = Math.floor(Math.random() * (keys.length - 1));
            let pushable = content.data.result[keys[index]];
            pushable.id = keys[index];
            endResult.push(pushable);
        }
    } else {
        for (let i = 0; i < keys.length; i++) {
            let pushable = content.data.result[keys[i]];
            pushable.id = keys[i];
            endResult.push(pushable);
        }
    }
    return endResult;
}

function generateDOMPost(postObject, index) {
    return $(`
        <div id="post-${index}" class="column hidden is-one-fifth">
            <div id="post-${index}-card" class="card clickable">
              <header class="card-header">
                <p class="card-header-title has-text-centered">${postObject.title}</p>
                ${localStorage.getItem("userID") === postObject.author ? `<button class="delete" onclick="deletePost(${postObject.id})"></button>` : ``}
              </header>
              <div class="card-content">
                <div class="content">
                  ${postObject.content.length > 35 ? postObject.content.slice(0, 35) + "..." : postObject.content}
                </div>
              </div>
            </div>
        </div>
    `)
}


function autoHeightAnimate(element, time, callback) {
    // citation: https://codepen.io/JTParrett/pen/CAglw
    let autoHeight = element.css('height', 'auto').height(); // Get Auto Height
    element.height(0); // Reset to Default Height
    element.show(1, function () {
        element.stop().animate({height: autoHeight, opacity: 1}, time, callback)
    });
}


async function loadContent() {
    let postObjects = await getRandomContent(5);
    let recentPostContainer = $("#random-posts-container");
    recentPostContainer.empty();
    for (let i = 0; i < postObjects.length; i++) {
        let currentPost = generateDOMPost(postObjects[i], i);
        currentPost.on("click", `#post-${i}-card`, function () {
            transitionFromHomeToPost(postObjects[i].id, i, postObjects[i])
        });
        recentPostContainer.append(currentPost);
    }
    $(".card").css("box-shadow", "0px 0px");
    for (let i = 0; i < postObjects.length; i++) {
        autoHeightAnimate($(`#post-${i}`), 650 + (300 * i), function () {
            $(`#post-${i}-card`).animate({boxShadow: "0 2px 3px rgba(10,10,10,.1), 0 0 0 1px rgba(10,10,10,.1)"}, function () {
                $(`#post-${i}-card`).removeAttr("style");
            });
        });
    }
}


async function getReccomendations(postObject) {
    let result = await axios.post("http://localhost:3000/reccomend", {
        data: {
            post: postObject
        }
    });
    return result;
}

async function loadReccomendations(id) {

}


async function transitionFromHomeToPost(postID, index, postObject) {
    let currentPost = $(`#post-${index}`);
    for (let i = 0; i < 5; i++) {
        if (i === 4 && i !== index) {
            $(`#post-${i}`).animate({opacity: 0}, 500, function () {
                let rect = currentPost.get(0).getBoundingClientRect();
                let parentRect = document.getElementById("random-posts-container").getBoundingClientRect();
                let newPost = currentPost.clone();
                newPost.css("left", rect.left);
                newPost.css("width", currentPost.css("width"));
                newPost.css("height", currentPost.css("height"));
                newPost.css("top", rect.top);

                newPost.css("position", "absolute");
                $(document.body).append(newPost);

                currentPost.css("position", "absolute");
                currentPost.css("opacity", 0);
                $("#all-posts").fadeOut(300, async function () {
                    newPost.removeClass("clickable");
                    newPost.trigger("blur");
                    newPost.find(".delete").remove();
                    newPost.css("padding", "0px");
                     let id = await getReccomendations(postObject);
                     setTimeout(loadReccomendations(id), 1000);
                    let okay = $(`
        <div id="hidden-columns" class="columns hidden">
            <div class="column">
                <div class="columns is-multiline">
                    <div class="column is-12">
                        ${newPost.html()}
                    </div>
                    <div class="column">
                        <div class="columns is-multiline">
                            <!-- {{ all comments }} -->
                        </div>
                    </div>
                </div>
            </div>
            <div id="reccomendations" class="column is-narrow">
                <!-- {{ reccomendation posts }} --> 
            </div>
        </div>`);
                    $("#focused-post-container").append(okay);
                    okay.find(".card-content").get(0).innerHTML = `${postObject.content}`;
                    let cardID = newPost.attr("id");
                    newPost.attr("id", "empty");


                    let focusedRect = $(`#${cardID}-card`).get(0).getBoundingClientRect();

                    console.log(focusedRect);
                    newPost.animate({left: focusedRect.left, top: focusedRect.top}, 750, function () {
                        newPost.find(".card-content").get(0).innerHTML = `${postObject.content}`;
                        newPost.animate({width: $(`#${cardID}-card`).css("width")}, function() {
                            $(`#hidden-columns`).removeClass("hidden");
                            newPost.remove();
                        });
                    });
                });
            });
        } else if (i !== index) {
            $(`#post-${i}`).animate({opacity: 0}, 500);
        }
    }
}


$(document).ready(async function () {
    $("#new-post-button").on("click", createNewPost);
    $("#search").on("input", debouncer(searchPosts, null, 500));

    // Load in the username or guest
    let isLoggedIn = localStorage.getItem("apiKey");
    if (isLoggedIn) {
        let innerTextGreeting = await getUserName();
        $("#username-greeting").text(innerTextGreeting);
        loadContent();
    } else {
        let innerTextGreeting = `Guest${Math.floor(Math.random() * 1000)}`;
        $("#username-greeting").text(innerTextGreeting);

        let createAccountButton = $("#create-account-button");
        createAccountButton.on("click", createAccountPopUp);

        $("#create-account-button-container").show();
        $("#login-button-container").show();
    }
});