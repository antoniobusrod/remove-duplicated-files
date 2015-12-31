'use strict';
const fs = require('mz/fs');
const crypto = require('crypto');
const path = require('path');
const util = require('util');
const EventEmitter = require('events').EventEmitter;

const emitter = new EventEmitter();

const defaults = {
  hashAlgorithm: 'sha256',
  digestEncoding: 'hex',
};

function checksum(filePath) {
  return new Promise(function(resolve, reject) {
    const stream = fs.createReadStream(filePath);
    const shasum = crypto.createHash(defaults.hashAlgorithm);
    stream.on('data', function(data) {
      shasum.update(data);
    });
    stream.on('end', function() {
      const digest = shasum.digest(defaults.digestEncoding);
      resolve(digest);
    });
    stream.on('error', reject);
  });
}

function processFileIterator(dir, hashes) {
  return function* processFile(file) {
    const filePath = path.join(dir, file);
    const stats = yield fs.stat(filePath);
    if (stats.isDirectory()) {
      return yield processDirectory(filePath, hashes);
    }
    const hash = yield checksum(filePath);
    emitter.emit('file');
    if (hashes[hash]) {
      yield fs.unlink(filePath);
      emitter.emit('file-removed', filePath);
    } else {
      hashes[hash] = true;
    }
  };
}

function* processDirectory(dir, hashes) {
  const files = yield fs.readdir(dir);
  yield files.map(processFileIterator(dir, hashes));
}

function* removeDuplicatedFiles(dir) {
  const hashes = {};
  yield processDirectory(dir, hashes);
}

module.exports = removeDuplicatedFiles;
module.exports.emitter = emitter;

