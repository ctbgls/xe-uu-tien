document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".dropdown").forEach(dropdown => {
        dropdown.addEventListener("mouseover", function () {
            this.querySelector(".dropdown-content").style.display = "block";
        });
        dropdown.addEventListener("mouseout", function () {
            this.querySelector(".dropdown-content").style.display = "none";
        });
        dropdown.querySelector(".dropbtn").addEventListener("click", function (event) {
            event.stopPropagation();
            let dropdownContent = this.nextElementSibling;
            dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
        });
    });

    document.addEventListener("click", function () {
        document.querySelectorAll(".dropdown-content").forEach(content => {
            content.style.display = "none";
        });
    });
});

const SPREADSHEET_ID = '1hk_O9RpZKHPwztiGL1kzvEwyWL2Y8s1fA4KpSnIg8dM';
const API_KEY = 'AIzaSyD68dloIAJg2XXnHgZN50vDyurhY5EAlh0';
const RANGE = 'uutien!A11:G10000';
let currentPage = 0;
let resultsPerPage;
let allRecords = [];

document.getElementById("searchBox").addEventListener("input", function () {
    fetchData();
});

window.addEventListener("resize", setPageSize);

function parseDate(input) {
    const parts = input.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function fetchData() {
    const searchValue = document.getElementById('searchBox').value.trim().toLowerCase();
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const sheetURL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;

    fetch(sheetURL)
        .then(response => response.json())
        .then(data => {
            allRecords = data.values || [];

            if (searchValue) {
                allRecords = allRecords.filter(item => item[1] && item[1].toLowerCase().startsWith(searchValue));
            }

            if (fromDate && toDate) {
                const fromTime = new Date(fromDate).getTime();
                const toTime = new Date(toDate).getTime();
                allRecords = allRecords.filter(item => {
                    if (item[3]) {
                        const [day, month, year] = item[3].split('/');
                        const itemDate = new Date(`${year}-${month}-${day}`).getTime();
                        return itemDate >= fromTime && itemDate <= toTime;
                    }
                    return false;
                });
            }

            allRecords.sort((a, b) => {
                const [dayA, monthA, yearA] = a[3].split('/');
                const [dayB, monthB, yearB] = b[3].split('/');
                const dateA = new Date(`${yearA}-${monthA}-${dayA}T${a[2]}`);
                const dateB = new Date(`${yearB}-${monthB}-${dayB} ${b[2]}`);
                return dateB - dateA;
            });

            currentPage = 0;
            setPageSize();
        })
        .catch(error => console.error("Lỗi khi lấy dữ liệu:", error));
}

function setPageSize() {
    resultsPerPage = window.innerWidth <= 768 ? 6 : 15;
    displayRecords();
}

function displayRecords() {
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    const start = currentPage * resultsPerPage;
    const end = start + resultsPerPage;
    let recordsToShow = allRecords.slice(start, end);

    recordsToShow.forEach((item, index) => {
        const row = `<tr>
            <td>${start + index + 1}</td>
            <td>${item[1].toUpperCase()}</td>
            <td>${item[2]}</td>
            <td>${item[3]}</td>
            <td>${item[4]}</td>
            <td>${item[5]}</td>
            <td>${item[6] || ''}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    const nextPageButton = document.getElementById("nextPage");
    const prevPageButton = document.getElementById("prevPage");

    nextPageButton.style.display = end < allRecords.length ? "inline-block" : "none";
    prevPageButton.style.display = currentPage > 0 ? "inline-block" : "none";
}

function nextPage() {
    currentPage++;
    displayRecords();
}

function prevPage() {
    currentPage--;
    displayRecords();
}

function exportToPDF() {
    const pageSize = 30;
    const date = new Date();
    const formattedDate = `Ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
    const content = [];

    for (let i = 0; i < allRecords.length; i += pageSize) {
        const pageRecords = allRecords.slice(i, i + pageSize);
        const body = pageRecords.map((item, index) => [
            { text: i + index + 1, alignment: 'center' },
            { text: item[1].toUpperCase(), alignment: 'center' },
            { text: item[2], alignment: 'center' },
            { text: item[3], alignment: 'center' },
            { text: item[4], alignment: 'center' },
            { text: item[5], alignment: 'center' },
            { text: item[6] || '', alignment: 'center' }
        ]);

        content.push({
            table: {
                headerRows: 1,
                widths: ['auto', '*', 'auto', 'auto', '*', '*', '*'],
                body: [
                    [
                        { text: 'STT', bold: true, alignment: 'center', fillColor: '#00247D', color: 'white' },
                        { text: 'Biển số', bold: true, alignment: 'center', fillColor: '#00247D', color: 'white' },
                        { text: 'Giờ', bold: true, alignment: 'center', fillColor: '#00247D', color: 'white' },
                        { text: 'Ngày', bold: true, alignment: 'center', fillColor: '#00247D', color: 'white' },
                        { text: 'Trạm vào', bold: true, alignment: 'center', fillColor: '#00247D', color: 'white' },
                        { text: 'Trạm ra', bold: true, alignment: 'center', fillColor: '#00247D', color: 'white' },
                        { text: 'Ghi chú', bold: true, alignment: 'center', fillColor: '#00247D', color: 'white' }
                    ],
                    ...body
                ]
            },
            pageBreak: i + pageSize < allRecords.length ? 'after' : undefined
        });
    }

    const docDefinition = {
        content: [
            { 
                text: 'BẢNG THỐNG KÊ SỐ LƯỢT MỞ ƯU TIÊN THEO BIỂN SỐ', 
                style: 'header'
            },
            { 
                text: formattedDate, 
                alignment: 'right', 
                margin: [0, 0, 0, 10] 
            },
            ...content
        ],
        styles: {
            header: {
                fontSize: 14,
                bold: true,
                alignment: 'center',
                margin: [0, 0, 0, 10]
            }
        },
        defaultStyle: {
            font: 'Roboto'
        }
    };

    pdfMake.createPdf(docDefinition).download('BaoCaoXeUuTien.pdf');
}

function exportToExcel() {
    const wb = XLSX.utils.book_new();
    const wsData = [
        ['STT', 'Biển số', 'Giờ', 'Ngày', 'Trạm vào', 'Trạm ra', 'Ghi chú'],
        ...allRecords.map((item, index) => [
            index + 1,
            item[1].toUpperCase(),
            item[2],
            item[3],
            item[4],
            item[5],
            item[6] || ''
        ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Xe Uu Tien');
    XLSX.writeFile(wb, 'BaoCaoXeUuTien.xlsx');
}
