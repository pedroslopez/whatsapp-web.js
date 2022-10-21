const fetch = require("node-fetch");
// Example POST method implementation:
async function postData(url, data) {
    // Default options are marked with *
   let data2 = this.data
    data2 = data.toString();
    data2 = JSON.stringify(data);

    const response = await fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json',
        Accept:'application/json',
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
       body: data2 // body data type must match "Content-Type" header
       
    });
    
    return response; // parses JSON response into native JavaScript objects
  }
   

    module.exports = {
        postData:postData,

    };