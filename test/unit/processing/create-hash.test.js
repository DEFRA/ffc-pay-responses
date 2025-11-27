const { createHash } = require('../../../app/processing/returns/create-hash')

describe('create hash', () => {
  test.each([
    ['SFI return message', 'SITI_SFIS000000200000002V0011000000002S250.002022-11-09PY1711007DAPFFCSITI_SFI Return File.csv', 'e2c759e70bf25e1ffe152c4b70bba9b6'],
    ['GENESIS return message', 'Genesis1098608AG003846211216.0020/07/2023B1892661DAPGENESISPayConf_23071 21211_SF01-012825.gni', '32507ddd91b3f6a0ca49549e7de2bc11'],
    ['GLOS return message', 'GLOS1061727531102259241EWCO285-21-229720/06/20232137.91184806169260729DAPFCAP_sequence_RPA_20230621 21008.dat', '17663901d26a85a19de057e2d75253b3'],
    ['IMPS return message', 'IMPS994204380225SCM/38022522-210-001P1848107115.45B20-JUN-230APRET_IMPS_AP_SF01-012674_GBP.INT', 'c132264d0cbcf5aada6c3c5811407cca']
  ])('should create unique hash for %s', (_, value, expected) => {
    expect(createHash(value)).toEqual(expected)
  })
})
