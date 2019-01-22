//Get Favourite food
function getFavouriteFood(name,conv){
    return new Promise((resolve, reject) => {
        var ref = admin.database().ref('/names');
        ref.orderByChild("name").equalTo(name).on("value", function(snapshot) {
            console.log(snapshot.key);
            if (snapshot.numChildren() > 1) {
                conv.add("There is more then 1 ");
                resolve("done");
            }
            else{
                var str  ="";
                 snapshot.forEach(function (childSnap) {
                    str += childSnap.val()['food'];
                 });
                
                conv.add("Your favourite food is " + str);
                resolve(str);
            }
        })
    });
}

