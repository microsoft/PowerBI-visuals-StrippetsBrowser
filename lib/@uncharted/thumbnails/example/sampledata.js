/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var thumbnailsSampleData = [
    {
        id: 1,
        imageUrl: 'http://mscorpnews.blob.core.windows.net/ncmedia/2015/11/000-all-future-011-1600x700.jpg',
        rank: 1,
        source: 'microsoft.com',
        sourceUrl: 'http://microsoft.com',
        sourceimage: 'https://tse1.mm.bing.net/th?&id=OIP.M3171d61d279961c0af79591e17bd762bo0&w=289&h=289&c=0&pid=1.9&rs=0&p=0&r=0',
        title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
        author: 'Nam Maximus',
        articledate: '2015-12-04 00:00:00',
        summary: 'Nam congue erat nulla, at lobortis velit efficitur eget. Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi. Nunc vitae sapien eget arcu egestas viverra eu vitae metus. Cras et tincidunt nunc. Suspendisse vitae feugiat justo, sed malesuada est.',
        entities: [
            {
                'name': 'Donald Trump',
                'type': 'person',
                'description': '',
                'firstPosition': '0.56',
            },
            {
                'name': 'Washington DC',
                'type': 'place',
                'description': 'rally in',
                'firstPosition': '0.36',
            },
            {
                'name': 'Barack Obama',
                'type': 'person',
                'description': '',
                'firstPosition': '0.66',
            },
            {
                'name': 'Trump Enterprises',
                'type': 'thing',
                'description': '',
                'firstPosition': '0.11',
            },
        ],
        url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
        readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
    },
    {
        id: 2,
        rank: 2,
        imageUrl: 'https://i.guim.co.uk/img/media/08422893c433f9b93a836f011ec65e33f020f191/0_96_2962_1778/master/2962.jpg?w=620&q=85&auto=format&sharp=10&s=584c6a435065101143cbd6c3fdbe66c0',
        source: 'google.com',
        sourceUrl: 'http://www.google.com',
        sourceimage: 'http://tse1.mm.bing.net/th?&id=OIP.Ma51a4d54e28e95bed67ec97f83c462d9o0&w=151&h=150&c=0&pid=1.9&rs=0&p=0&r=0',
        title: 'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo',
        author: 'Quisque Donec',
        articledate: '2015-12-27 00:00:00',
        summary: 'Mauris volutpat commodo nisi eu rutrum. Etiam molestie congue nibh id rhoncus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Maecenas ut dolor posuere, tempor dolor nec, mattis ex. Pellentesque lobortis leo ac eros sagittis, ac commodo velit feugiat.',
        entities: [
            {
                'name': 'Washington DC',
                'type': 'place',
                'description': 'rally in',
                'firstPosition': '0.36',
            },
            {
                'name': 'Barack Obama',
                'type': 'person',
                'description': '',
                'firstPosition': '0.66',
            },
            {
                'name': 'Trump Enterprises',
                'type': 'thing',
                'description': '',
                'firstPosition': '0.11',
            },
        ],

        url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
        readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
    },
    {
        id: 3,
        rank: 3,
        imageUrl: ['http://i2.cdn.turner.com/money/dam/assets/151111102126-artificial-intelligence-ai-robots-780x439.jpg', 'http://i.telegraph.co.uk/multimedia/archive/02050/Asimo1_2050237c.jpg'],
        source: 'google.com',
        sourceUrl: 'http://www.google.com',
        sourceimage: 'http://tse1.mm.bing.net/th?&id=OIP.Ma51a4d54e28e95bed67ec97f83c462d9o0&w=151&h=150&c=0&pid=1.9&rs=0&p=0&r=0',
        title: 'Sed lectus nulla, suscipit et faucibus et, congue a tellus.',
        author: 'Vivamus Aliquam',
        articledate: '2015-12-04 00:00:00',
        summary: 'Fusce suscipit odio dui. Maecenas blandit est a mauris interdum, id pellentesque velit feugiat. Morbi non volutpat magna. In vitae ipsum eget nibh fringilla auctor vitae rutrum lorem',
        entities: [
            {
                'name': 'Donald Trump',
                'type': 'person',
                'description': '',
                'firstPosition': '0.56',
            },
            {
                'name': 'Barack Obama',
                'type': 'person',
                'description': '',
                'firstPosition': '0.66',
            },
            {
                'name': 'Trump Enterprises',
                'type': 'thing',
                'description': '',
                'firstPosition': '0.11',
            },
        ],

        url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
        readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
    },
    {
        id: 4,
        rank: 4,
        imageUrl: ['http://media.gq.com/photos/56436afea3bd50211a99c42d/master/w_390/obama-gq-1215-05.jpg', 'http://a.abcnews.go.com/images/Politics/ap_barack_obama_press_conference_jc_151218_16x9_992.jpg', 'http://a.abcnews.go.com/images/US/AP_obama8_ml_150618_16x9_992.jpg'],
        source: 'cnn.com',
        sourceUrl: 'http://www.cnn.com/',
        sourceimage: 'http://www.i.cdn.cnn.com/.a/1.235.1/assets/logo_cnn_badge_2up.png',
        title: 'Morbi mollis lacus convallis odio hendrerit imperdiet',
        author: 'Pellentesque Nulla',
        articledate: '2015-09-28 00:00:00',
        summary: 'Morbi mollis lacus convallis odio hendrerit imperdiet. Proin eu lobortis eros. Pellentesque quis gravida leo, non pellentesque risus. Pellentesque ac rutrum urna, eget lacinia ante. Donec commodo, justo quis accumsan commodo, lacus lorem pharetra justo, volutpat rhoncus dui erat vel turpis.',
        entities: [
            {
                'name': 'Donald Trump',
                'type': 'person',
                'description': '',
                'firstPosition': '0.56',
            },
            {
                'name': 'Washington DC',
                'type': 'place',
                'description': 'rally in',
                'firstPosition': '0.36',
            },
            {
                'name': 'Trump Enterprises',
                'type': 'thing',
                'description': '',
                'firstPosition': '0.11',
            },
        ],

        url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
        readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
    },
    {
        id: 5,
        rank: 5,
        imageUrl: 'http://spectrum.ieee.org/assets/footer-logo-54ded86f182c0bcf8f26c9de4cb7c8f7.png',
        source: 'spectrum.ieee.org',
        sourceUrl: 'http://spectrum.ieee.org/',
        sourceimage: 'http://tse1.mm.bing.net/th?&id=OIP.M9d0060344126e6399b3778bfd03aee2bo0&w=150&h=150&c=0&pid=1.9&rs=0&p=0&r=0',
        title: 'Praesent ac diam enim',
        author: 'sagittis tortor',
        articledate: '',
        summary: '',
        entities: [
            {
                'name': 'Donald Trump',
                'type': 'person',
                'description': '',
                'firstPosition': '0.56',
            },
            {
                'name': 'Washington DC',
                'type': 'place',
                'description': 'rally in',
                'firstPosition': '0.36',
            },
            {
                'name': 'Barack Obama',
                'type': 'person',
                'description': '',
                'firstPosition': '0.66',
            },
        ],

        url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
        readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
    },
    {
        id: 6,
        rank: 6,
        imageUrl: 'https://tse1.mm.bing.net/th?&id=OIP.Mb624d2e713c40ca173a95786502847efo0&w=150&h=150&c=0&pid=1.9&rs=0&p=0&r=0',
        source: 'uncharted.software',
        sourceUrl: 'https://uncharted.software/',
        sourceimage: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQbmkz7Y3TslBDJPwZcAAd7epV9vN_zxNSQeH_8sF6nRcuFv5GZ',
        title: 'Uncharted Software',
        author: 'uncharted.software',
        articledate: '',
        summary: '',
        entities: [
            {
                'name': 'Donald Trump',
                'type': 'person',
                'description': '',
                'firstPosition': '0.56',
            },
        ],

        url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
        readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
    },
    {
        id: 7,
        rank: 7,
        imageUrl: 'http://mscorpnews.blob.core.windows.net/ncmedia/2015/11/000-all-future-011-1600x700.jpg',
        source: 'microsoft.com',
        sourceUrl: 'http://microsoft.com',
        sourceimage: 'https://tse1.mm.bing.net/th?&id=OIP.M3171d61d279961c0af79591e17bd762bo0&w=289&h=289&c=0&pid=1.9&rs=0&p=0&r=0',
        title: 'Ut lobortis hendrerit luctus',
        author: 'Nulla auctor',
        articledate: '2015-12-04 00:00:00',
        summary: 'Proin erat risus, elementum eu hendrerit in, imperdiet et velit. Aliquam tristique sodales lacus, non bibendum nunc feugiat quis. Pellentesque sapien sapien, aliquet ac vulputate vel, tempus ac libero. Nunc molestie, felis et blandit rutrum, purus lacus viverra urna, eu porttitor enim nisi sed nisl.',
        entities: [
            {
                'name': 'Donald Trump',
                'type': 'person',
                'description': '',
                'firstPosition': '0.56',
            },
            {
                'name': 'Washington DC',
                'type': 'place',
                'description': 'rally in',
                'firstPosition': '0.36',
            },
            {
                'name': 'Trump Enterprises',
                'type': 'thing',
                'description': '',
                'firstPosition': '0.11',
            },
        ],

        url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
        readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
    },
    {
        id: 8,
        rank: 8,
        imageUrl: 'https://i.guim.co.uk/img/media/08422893c433f9b93a836f011ec65e33f020f191/0_96_2962_1778/master/2962.jpg?w=620&q=85&auto=format&sharp=10&s=584c6a435065101143cbd6c3fdbe66c0',
        source: 'google.com',
        sourceUrl: 'http://www.google.com',
        sourceimage: 'http://tse1.mm.bing.net/th?&id=OIP.Ma51a4d54e28e95bed67ec97f83c462d9o0&w=151&h=150&c=0&pid=1.9&rs=0&p=0&r=0',
        title: 'Nunc diam massa, molestie ut hendrerit sed',
        author: 'sagittis interdum',
        articledate: '2015-12-27 00:00:00',
        summary: 'Phasellus rhoncus, urna vel congue posuere, tellus metus rhoncus magna, quis ornare tellus lacus ac purus. Donec rutrum, leo convallis gravida imperdiet, purus justo feugiat enim, ut egestas tellus lacus eget purus. ',
        entities: [
            {
                'name': 'Donald Trump',
                'type': 'person',
                'description': '',
                'firstPosition': '0.26',
            },
            {
                'name': 'Washington DC',
                'type': 'place',
                'description': 'rally in',
                'firstPosition': '0.36',
            },
            {
                'name': 'Barack Obama',
                'type': 'person',
                'description': '',
                'firstPosition': '0.16',
            },
            {
                'name': 'Trump Enterprises',
                'type': 'thing',
                'description': '',
                'firstPosition': '0.21',
            },
        ],

        url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
        readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
    },
    {
        id: 9,
        rank: 9,
        imageUrl: 'http://i2.cdn.turner.com/money/dam/assets/151111102126-artificial-intelligence-ai-robots-780x439.jpg',
        source: 'google.com',
        sourceUrl: 'http://www.google.com',
        sourceimage: 'http://tse1.mm.bing.net/th?&id=OIP.Ma51a4d54e28e95bed67ec97f83c462d9o0&w=151&h=150&c=0&pid=1.9&rs=0&p=0&r=0',
        title: 'Phasellus luctus mauris mi, at ultrices nunc sagittis interdum',
        author: 'faucibus convallis',
        articledate: '2015-12-04 00:00:00',
        summary: 'Fusce lacinia finibus efficitur. Nunc urna metus, efficitur nec sollicitudin quis, tincidunt sit amet urna. Duis lacus orci, aliquet nec elit id, sodales vehicula magna.',
        entities: [
            {
                'name': 'Washington DC',
                'type': 'place',
                'description': 'rally in',
                'firstPosition': '0.36',
            },
            {
                'name': 'Barack Obama',
                'type': 'person',
                'description': '',
                'firstPosition': '0.26',
            },
            {
                'name': 'Trump Enterprises',
                'type': 'thing',
                'description': '',
                'firstPosition': '0.11',
            },
        ],

        url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
        readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
    },
    {
        id: 10,
        rank: 10,
        imageUrl: 'http://i2.cdn.turner.com/cnnnext/dam/assets/150928104501-obama-un-general-assembly-address-russia-ukraine-crimea-00003513-large-169.jpg',
        source: 'cnn.com',
        sourceUrl: 'http://www.cnn.com/',
        sourceimage: 'http://www.i.cdn.cnn.com/.a/1.235.1/assets/logo_cnn_badge_2up.png',
        title: 'Proin ut est dia',
        author: 'Aenean lectus',
        articledate: '2015-09-28 00:00:00',
        summary: 'Morbi blandit nunc id lacus lacinia, sit amet dignissim orci sodales. Praesent viverra lacinia diam, non lacinia nulla fermentum pulvinar. Sed accumsan iaculis felis, a rhoncus sem commodo a. Morbi nec risus nec est faucibus ullamcorper.',
        entities: [
            {
                'name': 'Donald Trump',
                'type': 'person',
                'description': '',
                'firstPosition': '0.56',
            },
            {
                'name': 'Washington DC',
                'type': 'place',
                'description': 'rally in',
                'firstPosition': '0.36',
            },
            {
                'name': 'Barack Obama',
                'type': 'person',
                'description': '',
                'firstPosition': '0.86',
            },
        ],

        url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
        readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
    },
    {
        id: 11,
        rank: 11,
        imageUrl: 'http://spectrum.ieee.org/assets/footer-logo-54ded86f182c0bcf8f26c9de4cb7c8f7.png',
        source: 'spectrum.ieee.org',
        sourceUrl: 'http://spectrum.ieee.org/',
        sourceimage: 'http://tse1.mm.bing.net/th?&id=OIP.M9d0060344126e6399b3778bfd03aee2bo0&w=150&h=150&c=0&pid=1.9&rs=0&p=0&r=0',
        title: 'Aliquam erat volutpat.',
        author: 'spectrum.ieee.org',
        articledate: '',
        summary: '',
        entities: [
            {
                'name': 'Donald Trump',
                'type': 'person',
                'description': '',
                'firstPosition': '0.26',
            },
            {
                'name': 'Trump Enterprises',
                'type': 'thing',
                'description': '',
                'firstPosition': '0.11',
            },
        ],

        url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
        readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
    },
    {
        id: 12,
        rank: 12,
        imageUrl: 'https://tse1.mm.bing.net/th?&id=OIP.Mb624d2e713c40ca173a95786502847efo0&w=150&h=150&c=0&pid=1.9&rs=0&p=0&r=0',
        source: 'uncharted.software',
        sourceUrl: 'https://uncharted.software/',
        sourceimage: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQbmkz7Y3TslBDJPwZcAAd7epV9vN_zxNSQeH_8sF6nRcuFv5GZ',
        title: 'Uncharted Software',
        author: 'uncharted.software',
        articledate: '',
        summary: '',
        entities: [
            {
                'name': 'Donald Trump',
                'type': 'person',
                'description': '',
                'firstPosition': '0.56',
            },
            {
                'name': 'Washington DC',
                'type': 'place',
                'description': 'rally in',
                'firstPosition': '0.26',
            },
            {
                'name': 'Trump Enterprises',
                'type': 'thing',
                'description': '',
                'firstPosition': '0.11',
            },
        ],

        url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
        readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
    },
];