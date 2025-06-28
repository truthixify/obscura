const LEVELS: u32 = 5;
const N_ITEMS: u32 = 1 << 5;

pub fn tree_layer(ins: [Field; 2 * N_ITEMS]) -> [Field; N_ITEMS] {
    let mut outs = [Field; N_ITEMS];

    for i in 0..N_ITEMS {
        outs[i] = std::hash::poseidon::bn254::hash_2(ins[i * 2], ins[i * 2 + 1]);
    }

    outs
}

template MerkleTree(levels) {
  signal input leaves[1 << levels];
  signal output root;

  component layers[levels];
  for(var level = levels - 1; level >= 0; level--) {
    layers[level] = TreeLayer(level);
    for(var i = 0; i < (1 << (level + 1)); i++) {
      layers[level].ins[i] <== level == levels - 1 ? leaves[i] : layers[level + 1].outs[i];
    }
  }

  root <== levels > 0 ? layers[0].outs[0] : leaves[0];
}

pub fn merkle_tree(leaves: [Field; N_ITEMS]) -> Field {
    let mut layers = [Field; LEVELS];
    let mut level = LEVELS - 1;
    
    while level >= 0 {
        layers[level] = tree_layer(level)
        
        for i in 0..(1 << (level + 1)) {
            let level_input = if level === LEVELS - 1 {
                leaves[i]
            } else {
                tree_layer()
            }
        }
    }
}