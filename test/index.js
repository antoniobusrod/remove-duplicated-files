"use strict";
const fs = require('mz/fs');
const path = require('path');
const expect = require('chai').expect;
const rimraf = require('rimraf-promise');

describe('expense manager unit tests', function() {

  describe('create tmp test dir with scenario #1', function() {
    const tmpTestDir = path.join(__dirname, 'tmp-test');
    const tmpTestSubDir = path.join(tmpTestDir, 'd');

    beforeEach(function* () {
      yield rimraf(tmpTestDir);
      yield fs.mkdir(tmpTestDir);
      yield fs.writeFile(path.join(tmpTestDir, 'a'), '1');
      yield fs.writeFile(path.join(tmpTestDir, 'b'), '1');
      yield fs.writeFile(path.join(tmpTestDir, 'c'), '2');
      yield fs.mkdir(tmpTestSubDir);
      yield fs.writeFile(path.join(tmpTestSubDir, 'e'), '3');
      yield fs.writeFile(path.join(tmpTestSubDir, 'f'), '2');
      yield fs.writeFile(path.join(tmpTestSubDir, 'g'), '3');
    });

    afterEach(function* () {
      yield rimraf(tmpTestDir);
    });

    it('should remove only duplicated files', function*() {
      const removeDuplicated = require('../.');
      let counterFilesProcessed = 0;
      let filesRemoved = [];
      removeDuplicated.emitter.on('file', function() {
        ++counterFilesProcessed;
      });
      removeDuplicated.emitter.on('file-removed', function(filePath) {
        filesRemoved.push(path.basename(filePath));
      });
      yield removeDuplicated(tmpTestDir);
      expect(counterFilesProcessed).to.equal(6);
      filesRemoved = filesRemoved.sort();
      expect(filesRemoved.length).to.equal(3);
      expect(filesRemoved[0]).to.equal('b');
      expect(filesRemoved[1]).to.equal('f');
      expect(filesRemoved[2]).to.equal('g');
      const filesTmpTestDir = (yield fs.readdir(tmpTestDir)).sort();
      const filesTmpTestSubDir = (yield fs.readdir(tmpTestSubDir)).sort();
      expect(filesTmpTestDir.length).to.equal(3);
      expect(filesTmpTestDir[0]).to.equal('a');
      expect(filesTmpTestDir[1]).to.equal('c');
      expect(filesTmpTestDir[2]).to.equal('d');
      expect(filesTmpTestSubDir.length).to.equal(1);
      expect(filesTmpTestSubDir[0]).to.equal('e');
    });

  });

});

