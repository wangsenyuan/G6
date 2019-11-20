const expect = require('chai').expect;
// 注意：这里不能直接require原始的src文件，而要使用build后的文件，因为web worker代码是通过worker-loader内联进来的。
const G6 = require('../../../build/g6');
const data = require('./data.json');

const div = document.createElement('div');
div.id = 'layout-web-worker';
document.body.appendChild(div);

function mathEqual(a, b) {
  return Math.abs(a - b) < 1;
}

describe('layout using web worker', function() {
  this.timeout(10000);

  it('change layout', function(done) {
    const node = data.nodes[0];
    const graph = new G6.Graph({
      container: div,
      layout: {
        type: 'circular',
        // use web worker to layout
        workerEnabled: true
      },
      width: 500,
      height: 500,
      defaultNode: { size: 10 }
    });

    graph.data(data);
    // 下面的graph.updateLayout又会触发一次afterLayout，为了避免这里的event handler重复执行，
    // 这里用了graph.one.
    graph.one('afterlayout', () => {
      expect(mathEqual(node.x, 500)).to.equal(true);
      expect(mathEqual(node.y, 250)).to.equal(true);
    });
    graph.render();

    let count = 0;
    let ended = false;

    setTimeout(() => {
      // 只执行一次
      graph.one('afterlayout', () => {
        expect(node.x).to.not.be.undefined;
        expect(node.y).to.not.be.undefined;
        expect(count >= 1).to.be.true;
        expect(ended).to.be.true;
        graph.destroy();
        done();
      });
      graph.updateLayout({
        type: 'force',
        onTick() {
          count++;
          expect(node.x).to.not.be.undefined;
          expect(node.y).to.not.be.undefined;
        },
        onLayoutEnd() {
          ended = true;
        },
        // use web worker to layout
        workerEnabled: true
      });
    }, 1000);
  });
});
