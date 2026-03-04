import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        /*
        destination(req, file, cb)
        Called for each file.

        Parameters:
        1. req: the current Express request object.
        2. file: an object describing the incoming file (fieldname, originalname, mimetype, etc.).
        3. cb: callback to tell Multer where to store it.

        cb -> call back function
        cb() takes (error, address where multimedia is kept)
        i.e. cb(error, directoryPath)
        
        null -> no error
        "./public/images" = all uploaded files go into that folder (relative to where the Node process is running).
        */
        cb(null, `./public/images`);
    },
    filename: function (req, file, cb) {
        /*
        filename(req, file, cb)
        Also called for each file. | Controls the final file name on disk.

        Intent:
        Date.now() makes the name unique (timestamp).
        'file.originalname' is the original filename from the client (e.g., avatar.png).

        So a file called avatar.png becomes something like: 1719823456789-avatar.png.

        cb(error, name of file)
        */
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 1 * 1000 * 1000, // 1MB approx. | 1MB = 1024 Kilobytes = 1024 * 1024 Bytes = 1,048,576 Bytes
    },
});
