
"use client";

export default function Explanation({ onBack }) {
  return (
    <section className="information-screen">
      <div className="information-card explanation-card">

        <p className="section-label">
          A LITTLE MESSAGE FROM ME
        </p>

        <h1>Điều anh muốn nói</h1>

        <div className="explanation-heart">
          ♥
        </div>

        <div className="explanation-content">

          <h2>Chào em, cô công chúa của anh!</h2>

          <p>
            Chào em, anh ở đây là để giải thích cho em hiểu
            những ý nghĩa mà anh đã gửi gắm vào trò chơi nhỏ này.
          </p>

          <p>
            Ở trong game này sẽ chẳng có chàng hoàng tử nào
            đi giải cứu công chúa cả đâu. Mà ngược lại,
            chính em sẽ là cô công chúa đi giải cứu hoàng tử
            của mình.
          </p>

          <p className="special-message">
            Và anh chính là chàng hoàng tử đó. Hehee! ♥
          </p>

          <div className="message-divider">
            <span>♡</span>
          </div>

          <h2>Còn những hồn ma thì sao?</h2>

          <p>
            Những hồn ma xuất hiện trong trò chơi chính là
            những người muốn theo đuổi em.
          </p>

          <p>
            Nhiệm vụ của em là tiêu diệt tất cả bọn chúng,
            không để bất kỳ ai có cơ hội chen vào giữa
            hai chúng ta, để cuối cùng em có thể đến bên anh.
          </p>

          <div className="message-divider">
            <span>♡</span>
          </div>

          <h2>Một lời nhắn dành riêng cho em...</h2>

          <p>
            Chúc em có một buổi tối thật vui vẻ và bình yên nhé!
          </p>

          <p>
            Nếu có lúc nào em cảm thấy cô đơn, hay đơn giản
            chỉ là nhớ anh, em có thể đi tìm hoàng tử của mình.
          </p>

          <p className="special-message final-message">
            Anh vẫn sẽ luôn ở đó, đợi em đến và dành cho em
            một cái ôm thật ấm áp. 
          </p>

          <div className="ending-heart">
            ♥
          </div>

          <p className="signature">
            From your prince, with love.
          </p>

        </div>

        <button
          className="back-button"
          onClick={onBack}
        >
          ← QUAY VỀ MENU
        </button>

      </div>
    </section>
  );
}
