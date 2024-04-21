function handleTime(seconds) {
    let date = new Date(seconds);
  
    const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
    const monthIndex = date.getMonth();
    const month = monthNames[monthIndex];
  
    const day = date.getDate()
    const year = date.getFullYear()
  
    
    return `${day}-${month}-${year}`
  }