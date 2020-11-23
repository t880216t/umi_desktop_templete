const xml2map = require('xml2map');
const _ = require('lodash')

export async function getDeviceHierarchy(deviceUrl) {
  return fetch(`http://${deviceUrl}/dump/hierarchy`, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
  })
    .then(res => res.json())
    .then(response => {
      var xml = response.result;
      xml = xml.replace(/content-desc=\"\"/g, 'content-desc="null"');
      const {hierarchy} = xml2map.tojson(xml);
      const adaptor = function(node) {
        if (node.bounds) {
          const bounds = node.bounds.match(/[\d\.]+/g);
          node.bounds = [
            ~~bounds[0],
            ~~bounds[1],
            bounds[2] - bounds[0],
            bounds[3] - bounds[1]
          ];
        }

        if (node.node) {
          node.nodes = node.node.length ? node.node : [node.node];
          node.nodes.forEach(adaptor);
          delete node.node;
        }

        return node;
      };

      let data;

      const matchedNode = _.findLast(hierarchy.node, i => {
        return (
          i !== null &&
          typeof i === 'object' &&
          i.package !== 'com.android.systemui'
        );
      });

      const FilterMatchedNode = _.findLast(matchedNode, i => {
        return (
          i['resource-id'] !== 'android:id/statusBarBackground'
        )
      })

      try {
        data = adaptor(FilterMatchedNode);
      } finally {
        return data
      }
    })
};

export async function clickByNode(deviceUrl, node) {
  let params = {
    "mask": 2097153,
    "childOrSibling": [],
    "childOrSiblingSelector": [],
  }
  if (node.hasOwnProperty('resource-id')){
    params.resourceId = node['resource-id']
  }
  if (node.hasOwnProperty('text')){
    params.resourceId = node.text
  }
  fetch(`http://${deviceUrl}/jsonrpc/0`, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "id": "06836478944c6fcd2f06d05ba105dd83",
      "method": "objInfo",
      "params": [params, 20000]
    })
  })
    .then(res => res.json())
    .then(resp => {
      console.log(resp)
    })
};

export function getNodeByNode(treeNode, needNode) {
  let matchedNode = null;
  const adaptor = function(node) {
    if (node){
      if (
        node.package === needNode.package &&
        node['resource-id'] === needNode['resource-id'] &&
        node['class'] === needNode['class'] &&
        node['text'] === needNode['text']
      ) {
        matchedNode = node;
      } else if (node.nodes){
        node.nodes.forEach(adaptor);
      }
    }
  }

  const filterNode = _.findLast(treeNode, i => {
    return (
      i !== null &&
      typeof i === 'object' &&
      i.package !== 'com.android.systemui'
    );
  });

  const FilterMatchedNode = _.findLast(filterNode, i => {
    return (
      i['resource-id'] !== 'android:id/statusBarBackground'
    )
  })

  try {
    adaptor(FilterMatchedNode);
  } finally {
    console.log('matchedNode:', matchedNode)
  }

  return matchedNode;
};
