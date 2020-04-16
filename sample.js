const axios = require('axios')
const fs = require('fs').promises
require('dotenv').config();


let robotax = axios.create({
    baseURL: 'https://robotax.io/api/v1/',    
    headers: {
        Authorization: 'Token ' + process.env.ROBOTAX_API_TOKEN
    }
})
robotax.interceptors.request.use(config => {
    console.log(config.url, encodeURI(config.url))
    config.url = encodeURI(config.url)
    return config
})


async function main() {
    let res = await robotax.get('organization/')
    console.log(res.data.results[0].license, res.data.results[0].expiry_date)

    let 사업자 = (await robotax.post('사업자/', {
        법인명_상호: '주식회사 테스트',
        대표자주민등록번호: 'xxxx',
        납세자ID: '8108100888', // 사업자번호 (개인은 주민등록번호)
        홈택스ID: 'test', // 홈택스 계정. 전자신고파일을 업로드하는 계정과 일치해야 함
        사업장소재지: '경기도 성남시 백현로 97',
        사업장전화번호: '01012345678',
        성명_대표자명: '홍길동',
        개업일: '2017-12-22',
        업종코드_list: ['722005']
    })).data
    console.log(사업자)

    const data = JSON.parse(await fs.readFile('전표.json'))
    let 전표Res = await robotax.post('전표/', data.map(row => {
        row.사업자 = 사업자.id
        return row
    }))
    console.log('전표 등록', 전표Res.status)
    
    let 부가가치세 = (await robotax.post('부가가치세/', {
        사업자: 사업자.id,
        과세기간_년기_월: "202001",
        신고서종류코드: "C17",
        신고구분코드: "03",
        신고구분상세코드: "01"        
    })).data

    console.log('실차감납부할세액', 부가가치세.records[1].실차감납부할세액)
    // delete test data
    await robotax.delete(`사업자/${사업자.id}/`) 
}


main().then(res => {}).catch(err => {
    console.log(err)
})

