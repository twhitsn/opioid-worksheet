Papa.parse("http://example.com/file.csv", {
    download: true,
    complete: function(results) {
        console.log(results);
    }
});
