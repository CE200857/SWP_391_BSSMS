import React, { useState } from 'react';

export default function FER202Demo() {
  const [number, setNumber] = useState(0);
  const [message, setMessage] = useState('Chưa có sự kiện');

  function handleButtonClick(customText, event) {
    event.preventDefault();
    console.log('Target element:', event.target);
    setMessage(`Bạn đã click nút với tham số: "${customText}"`);
  }

  function handleTripleIncrement() {
    setNumber(number + 1);
    setNumber(number + 1);
    setNumber(number + 1);
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>FER202: Event Handling & Render Cycle Demo</h1>

      <section style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h2>1. Event Handling & Synthetic Event</h2>
        
        <button 
          onClick={(e) => handleButtonClick('Bài tập FER202', e)}
          style={{ marginRight: '10px', padding: '8px 12px' }}
        >
          Click gửi tham số (Named Handler)
        </button>

        <button 
          onClick={() => alert('Đây là Inline Event Handler!')}
          style={{ padding: '8px 12px' }}
        >
          Click Inline Handler
        </button>

        <p><strong>Trạng thái Event:</strong> {message}</p>

        <blockquote style={{ background: '#f9f9f9', padding: '10px', borderLeft: '4px solid #ccc' }}>
          <strong>Ghi chú Event Pooling (React 16 vs 17+):</strong><br />
          Ở các phiên bản React 16 trở về trước, <code>SyntheticEvent</code> được đưa vào một "pool" để tái sử dụng hiệu năng (thuộc tính của <code>e</code> sẽ bị xoá về <code>null</code> nếu truy cập bất đồng bộ như <code>setTimeout</code>).<br />
          Từ <strong>React 17 trở đi</strong>, React đã <strong>loại bỏ Event Pooling</strong>, thuộc tính sự kiện không còn bị xoá tự động nữa.
        </blockquote>
      </section>

      <section style={{ border: '1px solid #ccc', padding: '15px' }}>
        <h2>2. State as a Snapshot & Render Trigger</h2>
        <h3>Giá trị hiện tại của Number: {number}</h3>

        <button 
          onClick={handleTripleIncrement}
          style={{ padding: '8px 12px', cursor: 'pointer' }}
        >
          Gọi setNumber(number + 1) ba lần liên tiếp
        </button>

        <p style={{ color: '#555' }}>
          <em>
            Khi bấm nút trên, dù gọi <code>setNumber(number + 1)</code> 3 lần, giá trị chỉ tăng thêm 1.<br />
            Lý do: State hoạt động như một <strong>Snapshot (Ảnh chụp)</strong> tại thời điểm render. Giá trị của <code>number</code> không đổi trong suốt quá trình xử lý sự kiện đó.
          </em>
        </p>
      </section>
    </div>
  );
}