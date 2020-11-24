const xml2map = require('xml2map');
const _ = require('lodash')

const fields = {
  "text": 1,
  "textContains": 2,
  "textMatches": 4,
  "textStartsWith": 8,
  "className": 16,
  "classNameMatches": 32,
  "description": 64,
  "descriptionContains": 128,
  "descriptionMatches": 256,
  "descriptionStartsWith": 512,
  "checkable": 1024,
  "checked": 2048,
  "clickable": 4096,
  "longClickable": 8192,
  "scrollable": 16384,
  "enabled": 32768,
  "focusable": 65536,
  "focused": 131072,
  "selected": 262144,
  "packageName": 524288,
  "packageNameMatches": 1048576,
  "resourceId": 2097152,
  "resourceIdMatches": 4194304,
  "index": 8388608,
  "instance": 16777216,
}

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
          if (node.node instanceof Array){
            node.nodes = node.node;
          }else {
            node.nodes = [node.node];
          }
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

export async function clickByNode(deviceUrl, node, callBack = null) {
  let mask = 0
  let params = {
    "mask": 0,
    "childOrSibling": [],
    "childOrSiblingSelector": [],
  }
  if (node.hasOwnProperty('resource-id')){
    params.resourceId = node['resource-id']
  }
  if (node.hasOwnProperty('text')){
    params.text = node.text
  }
  if (node.hasOwnProperty('package')){
    params.packageName = node.package
  }
  if (node.hasOwnProperty('index')){
    params.index = node.index
  }
  for (var key in params) {
    if (fields.hasOwnProperty(key)){
      mask += fields[key]
    }

  }
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': '*/*',
    'Connection': 'keep-alive',
  }
  params.mask = mask
  fetch(`http://${deviceUrl}/jsonrpc/0`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "id": new Date().getTime().toString(),
      "method": "objInfo",
      "params": [params]
    })
  })
    .then(res => res.json())
    .then(resp => {
      if (resp && resp.result){
        const { bottom, top, left, right } = resp.result.bounds
        const x = (bottom - top)/2 + top
        const y = (right - left)/2 + left
        fetch(`http://${deviceUrl}/jsonrpc/0`, {
          method: 'POST',
          headers,
          body: JSON.stringify({"jsonrpc": "2.0", "id": new Date().getTime().toString(), "method": "click", "params": [y, x]})
        })
          .then(res => res.json())
          .then(resp => {
            if (callBack){
              callBack(resp)
            }
          })
      }
    })
    .catch(e => {
      console.log('fetch error', e)
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
