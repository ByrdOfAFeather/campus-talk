
async function getUser(userID) {  // get a specific user's data
    try {
        let res = await axios.get('http://localhost:3000/account/status', {headers:{"Authorization": "Bearer " + localStorage.getItem("apiKey") }});
        return res.data;
        //TODO:
    } catch (error) {
        console.log(Object.keys(error)); // list keys to try
        console.log(error.response.data); // this happens to be what you are looking for
        return false;
    }
}

async function toggleLike(currentUserID, contentID) {   // if the logged in user has liked a post, unlike it and vice versa
    // for current user, check if contentID is in users likePosts.  if it is,

    let userResponse = await axios.get(`http://localhost:3000/private/users/${currentUserID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let postResponse = await axios.get(`http://localhost:3000/private/posts/${contentID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let usersLikedPosts = userResponse.data.result['likedPosts'];
    let postsUsersWhoLiked = postResponse.data.result['usersWhoLikedThePost'];

    if (userResponse.status == 200 && postResponse.status == 200) {
        if (usersLikedPosts.contains(contentID)) { // if the post has already been liked and the user is unliking, remove like from user's liked post and post
            for (let i = 0; i < usersLikedPosts.length; i++) {
                if (usersLikedPosts[i] == contentID) { //apparently this causes a critical section error but i can't think of a way around this
                    usersLikedPosts.splice(i, i + 1);
                }
            }
            for (let i = 0; i < postsUsersWhoLiked.length; i++) { //iterate through users liked posts and remove the selected post
                if (postsUsersWhoLiked[i] == currentUserID) {
                    postsUsersWhoLiked.splice(i, i + 1);
                }
            }
            /*
            pretty sure that because of the way the api is set up I cant use merge to change the "likePosts" of the user
            and the "usersWhoLikedThePost" because merge takes the union of the two I think.  So I have to make the change
            client side instead, by deleting the servers value for these two items and replacing it with my own, but
            according to the TA this can cause a critical section error but i see no other way around it short of
            modifying the api itself to support a "destructive merge" type operation
             */

            //await axios.



            await axios.post('http://localhost:3000/private/users/${localStorage.getItem("userID")}/likedPosts', {
                'data': usersLikedPosts,
            }, {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("apiKey")
                }
            });
            await axios.post('http://localhost:3000/private/posts/${contentID}/usersWhoLikedThePost', {
                'data': postsUsersWhoLiked,
            }, {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("apiKey")
                }
            });
        } else { // add stuff to content and user
            await axios.post('http://localhost:3000/private/users/${localStorage.getItem("userID")}/likedPosts', {
                'data': contentID,
                'type': merge
            }, {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("apiKey")
                }
            });

            await axios.post('http://localhost:3000/private/posts/${contentID}/usersWhoLikedThePost', {
                'data': postsUsersWhoLiked,
                'type': merge
            }, {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("apiKey")
                }
            });
        }
    }
}

async function editPost(userID, postID, newTitle, newBody) {
    let res = await axios.get(`http://localhost:3000/private/posts/${postID}/`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});

    let otherAuthor = res.data.result['author'];
    console.log("before delete: " + otherAuthor);


    let deleteResult = await axios.delete(`http://localhost:3000/private/posts/${postID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});

    let sameAuthor = res.data.result['author'];
    console.log("after delete" + sameAuthor);


    await axios.post(`http://localhost:3000/private/posts/${postID}/`, {
        data : {
            title: newTitle,
            content: newBody,
            author: res.data.result['author'],
            date: res.data.result['date'],
            numberOfLikes: res.data.result['numberOfLikes'],
            comments: res.data.result['comments'],
            usersWhoLikedThePost: res.data.result['usersWhoLikedThePost']
        },
    }, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("apiKey")}`
        },
    });

}

async function editComment(userID, postID, newBody) {
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
}






// temp testing function
async function tempCreateFunction(usernameInput,passwordInput) {
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
    });
}


//Testing
//tempCreateFunction("brian", "password6");