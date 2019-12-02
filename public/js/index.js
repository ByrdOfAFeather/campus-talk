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
        let userComments = await getUserPosts(commentObject.author);

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
    let postObjectRequest = axios.get(`http://localhost:3000/private/posts/${postID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let postObject = postObjectRequest.data.result;

    await deleteCommentsFromPost(postObject.comments);

    let currentUserObjectRequest = await axios.get(`http://localhost:3000/private/users/${localStorage.getItem("userID")}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let currentUserObject = currentUserObjectRequest.data.result;
    let userPosts = await getUserPosts(currentUserObject.posts);

    let foundIndex = null;
    userPosts.find(function (value, index) {
        if (`${value}` === `${postID}`) {
            foundIndex = index;
            return true;
        } else {
            return false;
        }
    });

    await axios.post(`http://localhost:3000/private/users/${localStorage.getItem("userID")}/posts`, {
        "data": userPosts,
    }, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("apiKey")
        }
    });

    let deleteRequest = await axios.delete(`http://localhost:3000/private/comments/${postID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
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
        newPostContainer.remove();
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
                console.log("I'm geting here");
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
}

async function getRandomContent(numberOfPosts) {
    let content = await axios.get("http://localhost:3000/private/posts", {
        headers: {"Authorization": `Bearer ${localStorage.getItem("apiKey")}`},
    });
    let keys = Object.keys(content.data.result);

    let endResult = [];
    if (keys.length > numberOfPosts) {
        for (let i=0; i<numberOfPosts; i++) {
            let index = Math.floor(Math.random() * keys.length - 1);
            endResult.push(content.data.result[keys[index]]);
        }
    } else {
        for (let i=0; i<keys.length; i++) {
            endResult.push(content.data.result[keys[i]]);
        }
    }

    return endResult;
}

function generateDOMPost(postObject) {
    return $(`
        <div class="column">
            <div class="card">
              <header class="card-header">
                    <div class="level">
                        <div class="level-left">
                            <p class="card-header-title">${postObject.title}</p>
                        </div>
                        <div class="level-right">
                            ${localStorage.getItem("userID") === postObject.author ? `<button class="delete"></button>` : ``}
                        </div>
                    </div>
              </header>
              <div class="card-content">
                <div class="content">
                  ${postObject.content}
                </div>
              </div>
              <footer class="card-footer">
<!--                <a href="#" class="card-footer-item">Save</a>-->
<!--                <a href="#" class="card-footer-item">Edit</a>-->
<!--                <a href="#" class="card-footer-item">Delete</a>-->
              </footer>
            </div>
        </div>
    `)
}

async function loadContent() {
    let postObjects = await getRandomContent();
    let recentPostContainer = $("#random-posts-container");
    for (let i = 0; i<postObjects.length; i++) {
        let currentPost = generateDOMPost(postObjects[i]);
        recentPostContainer.append(currentPost);
    }
}


$(document).ready(async function () {
    $("#new-post-button").on("click", createNewPost);

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