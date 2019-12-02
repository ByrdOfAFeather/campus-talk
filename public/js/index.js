function cleanUpModal() {
    $("#modal-content-container").remove();
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
                <button id="submit-button" class="button is-inactive">Submit</button>
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
            $("#submit-button").removeClass("is-inactive");
            $("#submit-button").on("click", submitNewAccount);
        } else {
            $("#submit-button").addClass("is-inactive");
            $("#submit-button").off();
        }
    };

    form.on('input', "#username-input", updateIfValid);
    form.on('input', "#password-input", updateIfValid);
    form.on('input', "#email-input", updateIfValid);
    modal.show();
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
    for (let i = 0; i<comments.length; i++) {
        let curRequest = await axios.get(`http://localhost:3000/private/comments/${comments[i]}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
        commentObjects.push(curRequest.data.result);
    }

    return commentObjects;
}

async function getCommentObjectsFromUser(userID) {
    let response = await axios.get(`http://localhost:3000/private/users/${userID}/postsCommentedOn`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let comments = response.data.result;

    let commentObjects = [];
    for (let i = 0; i<comments.length; i++) {
        let curRequest = await axios.get(`http://localhost:3000/private/comments/${comments[i]}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
        commentObjects.push(curRequest.data.result);
    }

    return commentObjects;
}





async function createNewComment() {
    //TODO ACTUALLY GET INPUT
    let postID = 52356;
    let comment = "";
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

        comments.push(id);
        commentsViaPosts.push(id);
        axios.post(`http://localhost:3000/private/users/${localStorage.getItem("userID")}/postsCommentedOn`, {
            "data": comments,
            type: "merge"
        }, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("apiKey")
            }
        });

        axios.post(`http://localhost:3000/private/posts/${postID}/comments`, {
            "data": commentsViaPosts,
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
            <form id="new-post-form" class="form hidden" onsubmit="return false;">
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


$(document).ready(async function () {
    $("#new-post-button").on("click", createNewPost);

    // Load in the username or guest
    let innerTextGreeting = localStorage.getItem("apiKey").length !== null ? await getUserName() : `Guest${Math.floor(Math.random() * 1000)}`;
    $("#username-greeting").text(innerTextGreeting);
});