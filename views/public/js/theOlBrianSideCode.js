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

async function toggleLike(currentUserID, contentID, index) {   // if the logged in user has liked a post, unlike it and vice versa
                                                        // for current user, check if contentID is in users likePosts.  if it is,
    $(`#like-${index}`).css("background-color", $(`#like-${index}`).css("background-color") === "orange" ? "" : "orange");
    $(`#increment-me-${index}`).text(parseInt($(`#increment-me-${index}`).text(), 10) + 1);
    let userResponse = await axios.get(`http://localhost:3000/private/users/${currentUserID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let postResponse = await axios.get(`http://localhost:3000/private/posts/${contentID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let usersLikedPosts = userResponse.data.result['likedPosts'];
    let postsUsersWhoLiked = postResponse.data.result['usersWhoLikedThePost'];

    console.log(usersLikedPosts);

    if (userResponse.status == 200 && postResponse.status == 200) {
        if (usersLikedPosts.includes(contentID)) { // if the post has already been liked and the user is unliking, remove like from user's liked post and post
            await axios.delete(`http://localhost:3000/private/users/${currentUserID}/likedPosts`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
            await axios.delete(`http://localhost:3000/private/posts/${contentID}/usersWhoLikedThePost`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});

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

            await axios.post(`http://localhost:3000/private/users/${localStorage.getItem("userID")}/likedPosts`, {
                'data': usersLikedPosts,
            }, {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("apiKey")
                }
            });
            await axios.post(`http://localhost:3000/private/posts/${contentID}/usersWhoLikedThePost`, {
                'data': postsUsersWhoLiked,
            }, {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("apiKey")
                }
            });
        } else { // add stuff to content and user
            await axios.post(`http://localhost:3000/private/users/${localStorage.getItem("userID")}/likedPosts`, {
                'data': contentID,
                'type': "merge"
            }, {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("apiKey")
                }
            });

            await axios.post(`http://localhost:3000/private/posts/${contentID}/usersWhoLikedThePost`, {
                'data': currentUserID,
                'type': "merge"
            }, {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("apiKey")
                }
            });
        }
    }
}

async function editPost(userID, postID, newTitle, newBody) {
    let res = await axios.get(`http://localhost:3000/private/posts/${postID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let postObject = res.data.result;

    let deleteResult = await axios.delete(`http://localhost:3000/private/posts/${postID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});

    await axios.post(`http://localhost:3000/private/posts/${postID}`, {
        data : {
            title: newTitle,
            content: newBody,
            author: postObject['author'],
            date: postObject['date'],
            numberOfLikes: postObject['numberOfLikes'],
            comments: postObject['comments'],
            usersWhoLikedThePost: postObject['usersWhoLikedThePost'],
            id: postObject["id"]
        },
    }, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("apiKey")}`
        },
    });
}

async function editComment(userID, commentID, newBody) {
    let res = await axios.get(`http://localhost:3000/private/comments/${commentID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});
    let postObject = res.data.result;

    let deleteResult = await axios.delete(`http://localhost:3000/private/comments/${commentID}`, {headers: {"Authorization": "Bearer " + localStorage.getItem("apiKey")}});

    await axios.post(`http://localhost:3000/private/comments/${commentID}`, {
        data: {
            postID: postObject['postID'],
            author: userID,
            date: postObject['date'],
            comment: newBody
        }
    }, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("apiKey")
        },
    });

}