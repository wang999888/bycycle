# bycycle

## 启动

需要安装 Node.js 18 或更高版本。在项目目录执行：

```bash
npm start
```

然后访问 <http://localhost:3000>。提交数据会保存到服务器的 `data/records.json`，所有登记页也通过服务器接口读取和修改数据。

## GitHub Pages + Google Sheets

1. 新建一个 Google 表格，打开“扩展程序 / Apps Script”。
2. 将 [Code.gs](Code.gs) 的内容粘贴进去并保存。
3. 选择“部署 / 新部署”，类型选择“Web 应用”，执行身份选择“我”，访问权限选择“任何人”。
4. 复制 Web 应用 URL，将 `index.html` 和 `all.html` 中的 `REPLACE_WITH_DEPLOYMENT_ID` 替换为 URL 末尾的部署 ID。
5. 将修改后的文件推送到 GitHub Pages。

表格会自动创建 `Records` 工作表。Google Apps Script 的 Web 应用必须完成部署后，GitHub Pages 才能提交和读取数据。