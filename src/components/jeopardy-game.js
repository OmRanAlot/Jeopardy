"use client"

import { useState } from "react"
import { Button } from "../components/UI/button"
import { Input } from "../components/UI/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/UI/dialog"
import { gameData } from "../lib/game-data"

export default function JeopardyGame() {
  const [players, setPlayers] = useState([{ name: "Player 1", score: 0 }])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [playerAnswer, setPlayerAnswer] = useState("")
  const [newPlayerName, setNewPlayerName] = useState("")
  const [gameBoard, setGameBoard] = useState(gameData)

  const handleStartGame = () => {
    if (players.length > 0) {
      setGameStarted(true)
    }
  }

  const handleAddPlayer = () => {
    if (newPlayerName.trim() !== "") {
      setPlayers([...players, { name: newPlayerName, score: 0 }])
      setNewPlayerName("")
    }
  }

  const handleSelectQuestion = (category, value) => {
    const categoryIndex = gameBoard.findIndex((cat) => cat.title === category)
    const questionIndex = gameBoard[categoryIndex].questions.findIndex((q) => q.value === value)

    if (!gameBoard[categoryIndex].questions[questionIndex].answered) {
      setSelectedQuestion({
        category,
        value,
        question: gameBoard[categoryIndex].questions[questionIndex].question,
        answer: gameBoard[categoryIndex].questions[questionIndex].answer,
        answered: false,
      })

      // Mark question as answered in the game board
      const updatedGameBoard = [...gameBoard]
      updatedGameBoard[categoryIndex].questions[questionIndex].answered = true
      setGameBoard(updatedGameBoard)
    }
  }

  const handleCloseQuestion = () => {
    setSelectedQuestion(null)
    setShowAnswer(false)
    setPlayerAnswer("")

    // Move to next player
    setCurrentPlayer((currentPlayer + 1) % players.length)
  }

  const handleCorrectAnswer = () => {
    if (selectedQuestion) {
      const updatedPlayers = [...players]
      updatedPlayers[currentPlayer].score += selectedQuestion.value
      setPlayers(updatedPlayers)
      handleCloseQuestion()
    }
  }

  const handleIncorrectAnswer = () => {
    if (selectedQuestion) {
      const updatedPlayers = [...players]
      updatedPlayers[currentPlayer].score -= selectedQuestion.value
      setPlayers(updatedPlayers)
      handleCloseQuestion()
    }
  }

  const allQuestionsAnswered = gameBoard.every((category) => category.questions.every((question) => question.answered))

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 text-center mb-8">JEOPARDY</h1>

      {!gameStarted ? (
        <div className="bg-blue-900 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Player Setup</h2>
          <div className="space-y-4">
            {players.map((player, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-white">{player.name}</span>
                <Button
                className="bg-red-500 hover:bg-red-600"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (players.length > 1) {
                      setPlayers(players.filter((_, i) => i !== index))
                    }
                  }}
                  disabled={players.length <= 1}
                >
                  Remove
                </Button>
              </div>
            ))}

            <div className="flex gap-2">
              <Input
                placeholder="New player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="bg-white text-black"
              />
              <Button onClick={handleAddPlayer} className="bg-yellow-500 hover:bg-yellow-600">Add</Button>
            </div>

            <Button
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold"
              onClick={handleStartGame}
            >
              Start Game
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {/* Player scores */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {players.map((player, index) => (
              <div
                key={index}
                className={`bg-blue-900 p-4 rounded-lg text-center ${
                  index === currentPlayer ? "ring-4 ring-yellow-400" : ""
                }`}
              >
                <h3 className="text-white font-bold">{player.name}</h3>
                <p className={`text-2xl font-bold ${player.score >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ${player.score}
                </p>
              </div>
            ))}
          </div>

          {/* Game board */}
          <div className="grid grid-cols-6 gap-2">
            {/* Category headers */}
            {gameBoard.map((category) => (
              <div key={category.title} className="bg-blue-800 p-2 h-24 flex items-center justify-center">
                <h3 className="text-white font-bold text-center text-sm md:text-base">{category.title}</h3>
              </div>
            ))}

            {/* Questions grid */}
            {[0, 1, 2, 3, 4].map((row) =>
              gameBoard.map((category) => (
                <button
                  key={`${category.title}-${category.questions[row].value}`}
                  className={`bg-blue-700 h-16 md:h-20 flex items-center justify-center ${
                    category.questions[row].answered ? "opacity-50" : "hover:bg-blue-600"
                  }`}
                  onClick={() => handleSelectQuestion(category.title, category.questions[row].value)}
                  disabled={category.questions[row].answered}
                >
                  <span className="text-yellow-400 font-bold text-xl md:text-2xl">
                    ${category.questions[row].value}
                  </span>
                </button>
              )),
            )}
          </div>

          {allQuestionsAnswered && (
            <div className="mt-8 text-center">
              <h2 className="text-3xl font-bold text-yellow-400 mb-4">Game Over!</h2>
              <div className="bg-blue-900 p-6 rounded-lg max-w-md mx-auto">
                <h3 className="text-2xl text-white mb-4">Final Scores</h3>
                {players
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div key={index} className="flex justify-between mb-2">
                      <span className="text-white font-bold">{player.name}</span>
                      <span className={`font-bold ${player.score >= 0 ? "text-green-400" : "text-red-400"}`}>
                        ${player.score}
                      </span>
                    </div>
                  ))}
                <Button
                  className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold"
                  onClick={() => window.location.reload()}
                >
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question dialog */}
      <Dialog open={selectedQuestion !== null} onOpenChange={(open) => !open && handleCloseQuestion()}>
        <DialogContent className="bg-blue-900 border-blue-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-xl">
              {selectedQuestion?.category} - ${selectedQuestion?.value}
            </DialogTitle>
          </DialogHeader>

          <div className="py-8">
            <p className="text-center text-xl md:text-2xl font-medium">{selectedQuestion?.question}</p>
          </div>

          {!showAnswer ? (
            <div className="flex flex-col gap-4">
              <Button
                className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold"
                onClick={() => setShowAnswer(true)}
              >
                Show Answer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-800 p-4 rounded-lg">
                <p className="text-center text-xl font-bold text-yellow-400">{selectedQuestion?.answer}</p>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleCorrectAnswer}>
                  Correct
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleIncorrectAnswer}>
                  Incorrect
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
